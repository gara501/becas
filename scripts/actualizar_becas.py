"""Consulta incremental de fuentes oficiales y actualiza estados deterministas.

Uso:
  python scripts/actualizar_becas.py
  python scripts/actualizar_becas.py --solo-id CHEVENING-CO-2027
  python scripts/actualizar_becas.py --max 5
  python scripts/actualizar_becas.py --aplicar-revisiones data/actualizaciones/revisiones_confirmadas.csv

La detección de una fecha en una página genera una sugerencia, nunca cambia
automáticamente el plazo: páginas índice pueden mezclar varias becas.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import time
from collections import Counter
from datetime import date, datetime
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from zoneinfo import ZoneInfo

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "data/fase4/becas_limpias_geocodificadas.csv"
OUT = ROOT / "data/actualizaciones"
CURRENT = OUT / "becas_actualizadas.csv"
CACHE = OUT / "cache_fuentes.json"
AUDIT = OUT / "ultima_consulta.csv"
CANDIDATES = OUT / "candidatos_fecha.csv"
SUMMARY = OUT / "resumen.json"
REVIEW_TEMPLATE = OUT / "revisiones_confirmadas.csv"
RETIRED = OUT / "retiros.csv"
UNKNOWN = "No verificado"
USER_AGENT = "AtlasBecasColombia/1.0 (+https://github.com/gara501/becas; verificacion de becas publicas)"
MAX_BYTES = 12_000_000
MONTHS = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12, "january": 1, "february": 2, "march": 3,
    "april": 4, "may": 5, "june": 6, "july": 7, "august": 8, "september": 9,
    "october": 10, "november": 11, "december": 12,
}
KEYWORDS = re.compile(
    r"fecha(?:s)? de cierre|cierre de (?:la )?convocatoria|plazo (?:de|para) "
    r"(?:postulaci[oó]n|solicitud)|postulaciones? hasta|deadline|closing date|"
    r"applications? close|apply by|submission deadline", re.I
)
DATE_PATTERN = re.compile(
    r"\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b|"
    r"\b\d{1,2}\s+(?:de\s+)?(?:" + "|".join(MONTHS) + r")\s*,?\s*(?:de\s+)?20\d{2}\b|"
    r"\b(?:" + "|".join(MONTHS) + r")\s+\d{1,2},?\s+20\d{2}\b", re.I
)
AUDIT_FIELDS = [
    "id", "fecha_consulta", "url_oficial", "url_final", "codigo_http",
    "tipo_contenido", "resultado", "cambio_fuente", "candidatos_cierre",
    "requiere_revision", "detalle",
]
CANDIDATE_FIELDS = ["id", "nombre", "url_oficial", "fecha_candidata", "contexto", "fecha_cierre_actual"]
REVIEW_FIELDS = [
    "id", "accion", "fecha_cierre", "fecha_apertura", "estado_convocatoria",
    "url_oficial_nueva", "url_evidencia", "fecha_verificacion", "nota",
]
RETIRED_FIELDS = ["id", "nombre", "motivo", "url_evidencia", "fecha_verificacion"]


class TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self.parts = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip += 1
        elif tag in {"p", "li", "tr", "td", "th", "h1", "h2", "h3", "br"}:
            self.parts.append(" ")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip = max(0, self.skip - 1)
        elif tag in {"p", "li", "tr", "td", "th", "h1", "h2", "h3"}:
            self.parts.append(" ")

    def handle_data(self, data):
        if not self.skip:
            self.parts.append(data)


def normalize_text(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split())


def parse_date(raw: str) -> str | None:
    value = raw.strip().replace("/", "-").lower()
    try:
        if re.fullmatch(r"20\d{2}-\d{1,2}-\d{1,2}", value):
            year, month, day = map(int, value.split("-"))
            return date(year, month, day).isoformat()
        words = re.findall(r"[a-záéíóúñ]+|\d+", value)
        month = next((MONTHS[word] for word in words if word in MONTHS), None)
        if not month:
            return None
        year = next((int(word) for word in words if len(word) == 4 and word.startswith("20")), None)
        day = next((int(word) for word in words if word.isdigit() and len(word) <= 2), None)
        return date(year, month, day).isoformat() if year and day else None
    except ValueError:
        return None


def extract_candidates(text: str, as_of: date) -> list[tuple[str, str]]:
    results = []
    seen = set()
    for keyword in KEYWORDS.finditer(text):
        context = text[max(0, keyword.start() - 35):min(len(text), keyword.end() + 180)]
        for match in DATE_PATTERN.finditer(context):
            parsed = parse_date(match.group())
            if parsed and abs(int(parsed[:4]) - as_of.year) <= 2 and (parsed, context) not in seen:
                seen.add((parsed, context))
                results.append((parsed, normalize_text(context)[:220]))
    return results[:20]


def extract_text(content: bytes, content_type: str) -> tuple[str, str]:
    if "pdf" in content_type or content.startswith(b"%PDF"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content), strict=False)
            return normalize_text(" ".join(page.extract_text() or "" for page in reader.pages[:12])), "pdf"
        except ImportError:
            return "", "pdf_sin_lector"
        except Exception:
            return "", "pdf_no_extraible"
    if "html" in content_type or content.lstrip().lower().startswith((b"<!doctype html", b"<html")):
        parser = TextExtractor()
        parser.feed(content.decode("utf-8", errors="replace"))
        return normalize_text(" ".join(parser.parts)), "html"
    if "text" in content_type:
        return normalize_text(content.decode("utf-8", errors="replace")), "texto"
    return "", "formato_no_extraible"


def read_csv(path: Path) -> tuple[list[str], list[dict]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def write_csv(path: Path, fields: list[str], rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)
    temporary.replace(path)


def validate_rows(rows: list[dict]) -> None:
    if len(rows) != len({row["id"] for row in rows}):
        raise ValueError("La base contiene IDs duplicados")
    for row in rows:
        if urlparse(row["url_oficial"]).scheme != "https":
            raise ValueError(f"URL oficial insegura: {row['id']}")
        if not row["fecha_ultima_verificacion"]:
            raise ValueError(f"Falta fecha de verificación: {row['id']}")


def apply_reviews(rows: list[dict], path: Path, as_of: date) -> tuple[set[str], set[str]]:
    _, reviews = read_csv(path)
    by_id = {row["id"]: row for row in rows}
    identifiers = [item["id"].strip() for item in reviews if item["id"].strip()]
    if len(identifiers) != len(set(identifiers)):
        raise ValueError("El archivo de revisiones contiene IDs duplicados")
    old_retired = read_csv(RETIRED)[1] if RETIRED.exists() else []
    retired_log = {item["id"]: item for item in old_retired}
    updated = set()
    retired = set()
    for review in reviews:
        identifier = review["id"].strip()
        if not identifier:
            continue
        if identifier in retired_log and identifier not in by_id:
            continue
        if identifier not in by_id:
            raise ValueError(f"ID de revisión desconocido: {identifier}")
        evidence = review["url_evidencia"].strip()
        checked = review["fecha_verificacion"].strip()
        if urlparse(evidence).scheme != "https" or not re.fullmatch(r"20\d{2}-\d{2}-\d{2}", checked):
            raise ValueError(f"Revisión sin URL HTTPS o fecha ISO válida: {identifier}")
        if date.fromisoformat(checked) > as_of:
            raise ValueError(f"Fecha de revisión futura: {identifier}")
        row = by_id[identifier]
        action = review.get("accion", "").strip().lower() or "actualizar"
        note = review["nota"].strip()
        if action == "retirar":
            if not note:
                raise ValueError(f"El retiro requiere motivo documentado: {identifier}")
            retired_log[identifier] = {
                "id": identifier, "nombre": row["nombre"], "motivo": note,
                "url_evidencia": evidence, "fecha_verificacion": checked,
            }
            retired.add(identifier)
            continue
        if action != "actualizar":
            raise ValueError(f"Acción inválida en {identifier}")
        for field in ("fecha_cierre", "fecha_apertura"):
            value = review[field].strip()
            if value:
                if value != UNKNOWN and not re.fullmatch(r"20\d{2}-\d{2}-\d{2}", value):
                    raise ValueError(f"{field} debe ser AAAA-MM-DD en {identifier}")
                if value != UNKNOWN:
                    date.fromisoformat(value)
                row[field] = value
        state = review["estado_convocatoria"].strip().lower()
        if state:
            if state not in {"abierta", "cerrada", "recurrente"}:
                raise ValueError(f"Estado inválido en {identifier}")
            row["estado_convocatoria"] = state
            row["fecha_consulta_estado"] = checked
        new_url = review.get("url_oficial_nueva", "").strip()
        if new_url:
            if urlparse(new_url).scheme != "https":
                raise ValueError(f"URL oficial nueva inválida: {identifier}")
            row["url_oficial"] = new_url
        row["fuente_de_verificacion"] = evidence
        row["fecha_ultima_verificacion"] = checked
        if note and note not in row["notas"]:
            row["notas"] = (row["notas"].rstrip() + " " + note).strip()
        updated.add(identifier)
    if retired:
        rows[:] = [row for row in rows if row["id"] not in retired]
        write_csv(RETIRED, RETIRED_FIELDS, [retired_log[key] for key in sorted(retired_log)])
    return updated, retired

def fetch_url(session: requests.Session, url: str, previous: dict) -> tuple[dict, bytes]:
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/pdf;q=0.9,*/*;q=0.5"}
    if previous.get("etag"):
        headers["If-None-Match"] = previous["etag"]
    if previous.get("last_modified"):
        headers["If-Modified-Since"] = previous["last_modified"]
    response = session.get(url, headers=headers, timeout=(8, 25), stream=True)
    try:
        info = {
            "status": response.status_code, "final_url": response.url,
            "content_type": response.headers.get("Content-Type", "").lower(),
            "etag": response.headers.get("ETag", previous.get("etag", "")),
            "last_modified": response.headers.get("Last-Modified", previous.get("last_modified", "")),
        }
        if response.status_code == 304:
            return info, b""
        response.raise_for_status()
        chunks = []
        size = 0
        for chunk in response.iter_content(64 * 1024):
            size += len(chunk)
            if size > MAX_BYTES:
                raise ValueError("Archivo superior a 12 MB")
            chunks.append(chunk)
        return info, b"".join(chunks)
    finally:
        response.close()


def scan(rows: list[dict], as_of: date, selected_ids: set[str], maximum: int | None, reviewed_ids: set[str]) -> dict:
    prior_cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
    cache = dict(prior_cache)
    prior_audit = {row["id"]: row for row in read_csv(AUDIT)[1]} if AUDIT.exists() else {}
    audit = dict(prior_audit)
    previous_candidates = read_csv(CANDIDATES)[1] if CANDIDATES.exists() else []
    candidates_by_id = {}
    for item in previous_candidates:
        if item["id"] not in reviewed_ids:
            candidates_by_id.setdefault(item["id"], []).append(item)
    session = requests.Session()
    retry = Retry(total=2, connect=2, read=1, backoff_factor=0.7,
                  status_forcelist=[429, 500, 502, 503, 504],
                  allowed_methods=["GET"], respect_retry_after_header=True)
    session.mount("https://", HTTPAdapter(max_retries=retry))
    processed = 0
    last_host = {}
    url_results = {}
    for row in rows:
        if selected_ids and row["id"] not in selected_ids:
            continue
        if maximum is not None and processed >= maximum:
            break
        processed += 1
        url = row["url_oficial"]
        if url not in url_results:
            host = urlparse(url).hostname or ""
            elapsed = time.monotonic() - last_host.get(host, 0)
            if elapsed < 1:
                time.sleep(1 - elapsed)
            previous = prior_cache.get(url, {})
            try:
                info, content = fetch_url(session, url, previous)
                if info["status"] == 304:
                    result = "sin_cambios"
                    text = ""
                    fmt = previous.get("format", "no_verificado")
                    digest = previous.get("sha256", "")
                else:
                    digest = hashlib.sha256(content).hexdigest()
                    text, fmt = extract_text(content, info["content_type"])
                    result = "primera_consulta" if not previous.get("sha256") else ("sin_cambios" if digest == previous["sha256"] else "cambio_detectado")
                cache[url] = {
                    "sha256": digest, "etag": info["etag"], "last_modified": info["last_modified"],
                    "format": fmt, "checked_at": as_of.isoformat(), "final_url": info["final_url"],
                    "status": info["status"],
                }
                url_results[url] = (info, result, text, fmt)
            except (requests.RequestException, ValueError) as error:
                url_results[url] = ({"status": "", "final_url": url, "content_type": ""}, "error", "", str(error)[:180])
            last_host[host] = time.monotonic()
        info, result, text, fmt = url_results[url]
        found = extract_candidates(text, as_of) if text else []
        fresh_candidates = []
        for found_date, context in found:
            fresh_candidates.append({
                "id": row["id"], "nombre": row["nombre"], "url_oficial": url,
                "fecha_candidata": found_date, "contexto": context,
                "fecha_cierre_actual": row["fecha_cierre"],
            })
        if result not in {"sin_cambios", "error"}:
            candidates_by_id[row["id"]] = fresh_candidates
        old_state = row["estado_convocatoria"]
        deadline = row["fecha_cierre"]
        if old_state == "abierta" and re.fullmatch(r"20\d{2}-\d{2}-\d{2}", deadline):
            if date.fromisoformat(deadline) < as_of:
                row["estado_convocatoria"] = "cerrada"
                row["fecha_consulta_estado"] = as_of.isoformat()
        changed = result in {"primera_consulta", "cambio_detectado"}
        new_dates = {value for value, _ in found if value != deadline}
        previous_review = prior_audit.get(row["id"], {}).get("requiere_revision") == "Sí" and row["id"] not in reviewed_ids
        review = previous_review or result == "error" or result == "cambio_detectado" or (result == "primera_consulta" and as_of.isoformat() > row["fecha_ultima_verificacion"]) or bool(new_dates) or fmt in {"pdf_sin_lector", "pdf_no_extraible", "formato_no_extraible"}
        detail = fmt if result != "error" else fmt
        audit[row["id"]] = {
            "id": row["id"], "fecha_consulta": as_of.isoformat(),
            "url_oficial": url, "url_final": info["final_url"],
            "codigo_http": info["status"], "tipo_contenido": info["content_type"],
            "resultado": result, "cambio_fuente": "Sí" if result == "cambio_detectado" else ("No" if result == "sin_cambios" else UNKNOWN),
            "candidatos_cierre": "; ".join(sorted({value for value, _ in found})) or UNKNOWN,
            "requiere_revision": "Sí" if review else "No",
            "detalle": detail + ("; estado calculado: abierta → cerrada" if old_state != row["estado_convocatoria"] else ""),
        }
        print(f"{processed:02d} {row['id']}: {result}; {len(found)} fecha(s); revisión={'sí' if review else 'no'}")
    write_csv(AUDIT, AUDIT_FIELDS, [audit[key] for key in sorted(audit)])
    candidates = [item for group in candidates_by_id.values() for item in group]
    write_csv(CANDIDATES, CANDIDATE_FIELDS, candidates)
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"consultadas": processed, "resultados": dict(Counter(audit[row["id"]]["resultado"] for row in rows if row["id"] in audit)),
            "pendientes_revision": sum(item["requiere_revision"] == "Sí" for item in audit.values()),
            "candidatos_fecha": len(candidates)}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--solo-id", action="append", default=[], help="ID a consultar; repetible")
    parser.add_argument("--max", type=int, dest="maximum", help="Máximo de registros a consultar")
    parser.add_argument("--aplicar-revisiones", type=Path, help="CSV de correcciones revisadas contra una fuente oficial")
    parser.add_argument("--sin-red", action="store_true", help="Aplicar revisiones sin consultar URLs")
    args = parser.parse_args()
    if args.maximum is not None and args.maximum < 1:
        parser.error("--max debe ser positivo")
    as_of = datetime.now(ZoneInfo("America/Bogota")).date()
    source = CURRENT if CURRENT.exists() else ORIGINAL
    fields, rows = read_csv(source)
    validate_rows(rows)
    unknown_ids = set(args.solo_id) - {row["id"] for row in rows}
    if unknown_ids:
        parser.error("IDs desconocidos: " + ", ".join(sorted(unknown_ids)))
    OUT.mkdir(parents=True, exist_ok=True)
    if REVIEW_TEMPLATE.exists():
        template_fields, template_rows = read_csv(REVIEW_TEMPLATE)
        if template_fields != REVIEW_FIELDS and not template_rows:
            write_csv(REVIEW_TEMPLATE, REVIEW_FIELDS, [])
    else:
        write_csv(REVIEW_TEMPLATE, REVIEW_FIELDS, [])
    reviewed_ids, retired_ids = apply_reviews(rows, args.aplicar_revisiones, as_of) if args.aplicar_revisiones else (set(), set())
    if (reviewed_ids or retired_ids) and AUDIT.exists():
        audit_fields, audit_rows = read_csv(AUDIT)
        for item in audit_rows:
            if item["id"] in reviewed_ids:
                item["requiere_revision"] = "No"
                item["detalle"] = "Revisión manual aplicada"
        write_csv(AUDIT, audit_fields, [item for item in audit_rows if item["id"] not in retired_ids])
    if (reviewed_ids or retired_ids) and CANDIDATES.exists():
        candidate_fields, candidate_rows = read_csv(CANDIDATES)
        write_csv(CANDIDATES, candidate_fields, [item for item in candidate_rows if item["id"] not in reviewed_ids | retired_ids])
    report = {"fecha_ejecucion": as_of.isoformat(), "registros": len(rows), "revisiones_aplicadas": len(reviewed_ids), "retiradas": len(retired_ids)}
    if not args.sin_red:
        report.update(scan(rows, as_of, set(args.solo_id), args.maximum, reviewed_ids))
    elif AUDIT.exists():
        report["pendientes_revision"] = sum(item["requiere_revision"] == "Sí" for item in read_csv(AUDIT)[1])
    write_csv(CURRENT, fields, rows)
    SUMMARY.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Salida: {CURRENT.relative_to(ROOT)} | {SUMMARY.relative_to(ROOT)}")
    print("Las fechas candidatas no se publican hasta su revisión. El corte de verificación individual se conserva.")


if __name__ == "__main__":
    main()
