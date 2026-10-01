"""Empaqueta la base verificada en la SPA sin peticiones de datos en runtime.

Uso: python scripts/exportar_web.py
Prefiere el CSV incremental si existe; mantiene las fechas individuales de verificación.
"""
import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "data" / "fase4" / "becas_limpias_geocodificadas.csv"
UPDATED = ROOT / "data" / "actualizaciones" / "becas_actualizadas.csv"
SOURCE = UPDATED if UPDATED.exists() else BASE
REPORT = ROOT / "data" / "actualizaciones" / "resumen.json"
GEO_SOURCE = ROOT / "data" / "fase4" / "geocodigos_aprobados.csv"
DATA_DIR = ROOT / "src" / "data"

with SOURCE.open(encoding="utf-8-sig", newline="") as file:
    rows = list(csv.DictReader(file))
with GEO_SOURCE.open(encoding="utf-8-sig", newline="") as file:
    places = list(csv.DictReader(file))
assert len(rows) == len({row["id"] for row in rows})
assert all(row["url_oficial"].startswith("https://") for row in rows)
assert all(row["fecha_ultima_verificacion"] for row in rows)
report = json.loads(REPORT.read_text(encoding="utf-8")) if REPORT.exists() and SOURCE == UPDATED else {}
metadata = {
    "fecha_corte_verificado": min(row["fecha_ultima_verificacion"] for row in rows),
    "fecha_ultima_consulta": report.get("fecha_ejecucion", "2026-09-30"),
    "pendientes_revision": report.get("pendientes_revision", 0),
}
DATA_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "becas.json").write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
(DATA_DIR / "geocodigos.json").write_text(json.dumps(places, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
(DATA_DIR / "corte.json").write_text(json.dumps(metadata, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"Datos web: {len(rows)} convocatorias; {len(places)} lugares; {dict(Counter(r['estado_convocatoria'] for r in rows))}")
print(f"Fuente: {SOURCE.relative_to(ROOT)}; corte verificado más antiguo: {metadata['fecha_corte_verificado']}")
