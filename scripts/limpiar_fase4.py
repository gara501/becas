"""Normaliza, deduplica y geocodifica la fase 3 con candidatos OSM revisados.

Uso: python scripts/limpiar_fase4.py
Sin acceso a red: usa exclusivamente la caché creada por consultar_geocodigos_fase4.py.
"""
import csv
import json
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "fase3"
OUT = ROOT / "data" / "fase4"
CACHE = OUT / "candidatos_nominatim.json"
NV = "No verificado"
AS_OF = "2026-09-30"
LEVEL_ORDER = ["pregrado", "maestría", "doctorado", "postdoctorado", "idiomas", "curso corto", "intercambio"]
CODES = {
    "Alemania": "de", "Australia": "au", "Canadá": "ca", "Chile": "cl", "China": "cn",
    "Colombia": "co", "Corea del Sur": "kr", "España": "es", "Estados Unidos": "us",
    "Francia": "fr", "India": "in", "Japón": "jp", "México": "mx",
    "Países Bajos": "nl", "Reino Unido": "gb", "Singapur": "sg", "Suecia": "se",
}
# Coincidencias elegidas tras revisar tipo OSM, nombre y país. Dos campus
# universitarios precisos; el resto se ubica como máximo a escala de ciudad.
APPROVED_UNIVERSITIES = {
    "universidad|Colombia|Universidad de los Andes": 0,
    "universidad|México|Tecnológico de Monterrey": 0,
}
APPROVED_CITIES = {
    "ciudad|Australia|Melbourne": 0,
    "ciudad|Australia|Sídney": 0,
    "ciudad|Colombia|Bogotá": 0,
    "ciudad|España|Madrid": 0,
    "ciudad|India|Mohali": 0,
    "ciudad|México|Monterrey": 0,
    "ciudad|Países Bajos|Maastricht": 0,
    "ciudad|Reino Unido|Salford": 0,
    "ciudad|Singapur|Singapur": 0,
    "ciudad|Suecia|Lund": 0,
}

OUT.mkdir(parents=True, exist_ok=True)
with (SOURCE / "indice.csv").open(encoding="utf-8-sig", newline="") as f:
    file_names = [r["archivo"] for r in csv.DictReader(f)]
raw = []
for file_name in file_names:
    with (SOURCE / file_name).open(encoding="utf-8-sig", newline="") as f:
        raw.extend(csv.DictReader(f))
assert len(raw) == 46
assert len({r["id"] for r in raw}) == len(raw)
base_fields = list(raw[0])
by_id = {r["id"]: r for r in raw}

# Unificar modalidades de una sola convocatoria y conservar trazabilidad.
merges = [
    ("MINCIENCIAS-975-2026", ["MINCIENCIAS-975-M-2026", "MINCIENCIAS-975-D-2026"],
     "Becas para el Cambio 975 — maestría y doctorado nacional",
     "Se unifican modalidades 1 y 2 de la misma convocatoria 975."),
    ("CSC-CHINA-2026", ["CSC-CHINA-M-2026", "CSC-CHINA-D-2026"],
     "Beca Gobierno de China / CSC Type A — maestría y doctorado",
     "Se unifican las fichas ICETEX de maestría y doctorado de CSC Type A."),
]
merged_rows = []
merge_audit = []
for new_id, old_ids, title, why in merges:
    parts = [by_id.pop(old_id) for old_id in old_ids]
    row = dict(parts[0])
    row["id"] = new_id
    row["nombre"] = title
    row["nivel"] = "maestría; doctorado"
    row["ids_origen"] = "; ".join(old_ids)
    row["notas"] = why + " " + " ".join(p["notas"] for p in parts)
    if new_id.startswith("CSC"):
        row["monto_aproximado_y_moneda"] = "3000 CNY/mes maestría; 3500 CNY/mes doctorado; seguro 800 CNY/año; ICETEX indica 85 %"
        row["requisitos_clave"] = "Título profesional para maestría o maestría previa para doctorado; formulario CSC Type A; requisitos ICETEX"
        row["fuente_de_verificacion"] = "; ".join(p["url_oficial"] for p in parts)
    else:
        row["requisitos_clave"] = "Profesional colombiano; admisión o matrícula inicial en maestría o doctorado nacional elegible; requisitos de modalidad"
    merged_rows.append(row)
    merge_audit.append({"id_resultado": new_id, "ids_origen": "; ".join(old_ids), "motivo": why})

rows = list(by_id.values()) + merged_rows
assert len(rows) == 44
assert len({r["id"] for r in rows}) == 44
cache = json.loads(CACHE.read_text(encoding="utf-8"))
selected = {}
for country, code in CODES.items():
    key = f"pais|{country}"
    candidates = cache.get(key, [])
    assert candidates, key
    candidate = candidates[0]
    assert candidate["category"] == "boundary" and candidate["type"] == "administrative", key
    assert candidate["address"]["country_code"] == code, key
    selected[key] = candidate
for key, index in {**APPROVED_CITIES, **APPROVED_UNIVERSITIES}.items():
    candidate = cache[key][index]
    country = key.split("|")[1]
    assert candidate["address"]["country_code"] == CODES[country], key
    if key.startswith("universidad|"):
        assert candidate["category"] == "amenity" and candidate["type"] == "university", key
    selected[key] = candidate

geo_fields = ["clave_lugar", "nivel", "nombre_consultado", "pais_destino", "latitud", "longitud", "tipo_osm", "id_osm", "url_osm", "nombre_osm", "categoria_osm", "fecha_consulta", "fuente"]
with (OUT / "geocodigos_aprobados.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=geo_fields, lineterminator="\n")
    writer.writeheader()
    for key, item in sorted(selected.items()):
        level, country, *name = key.split("|")
        writer.writerow({
            "clave_lugar": key, "nivel": level, "nombre_consultado": name[0] if name else country,
            "pais_destino": country, "latitud": item["lat"], "longitud": item["lon"],
            "tipo_osm": item["osm_type"], "id_osm": item["osm_id"],
            "url_osm": f"https://www.openstreetmap.org/{item['osm_type']}/{item['osm_id']}",
            "nombre_osm": item["name"], "categoria_osm": f"{item['category']}/{item['type']}",
            "fecha_consulta": AS_OF, "fuente": "OpenStreetMap Nominatim",
        })

extra_fields = ["ids_origen", "pais_codigo", "url_geocodificacion", "fecha_geocodificacion", "nota_geocodificacion"]
output_fields = base_fields + extra_fields
for row in rows:
    row.setdefault("ids_origen", row["id"])
    row["pais_codigo"] = CODES.get(row["pais_destino"], NV).upper() if row["pais_destino"] in CODES else NV
    # Normalizar el orden de etiquetas multivalor; preservar términos documentados.
    parts = [v.strip() for v in row["nivel"].split(";")]
    row["nivel"] = "; ".join(sorted(set(parts), key=lambda v: LEVEL_ORDER.index(v) if v in LEVEL_ORDER else 99))
    if row["id"] == "MONASH-MGS-2027":
        row["ciudad"] = NV
        row["notas"] += " El programa admite varios campus Monash; no se asigna Melbourne como sede única."
    country = row["pais_destino"]
    place_key = None
    if country in CODES:
        place_key = f"pais|{country}"
        city_key = f"ciudad|{country}|{row['ciudad']}"
        university_key = f"universidad|{country}|{row['universidad']}"
        if city_key in APPROVED_CITIES:
            place_key = city_key
        if university_key in APPROVED_UNIVERSITIES:
            place_key = university_key
    if place_key:
        item = selected[place_key]
        level = place_key.split("|")[0]
        row["latitud"] = item["lat"]
        row["longitud"] = item["lon"]
        row["precision_ubicacion"] = "país" if level == "pais" else level
        row["url_geocodificacion"] = f"https://www.openstreetmap.org/{item['osm_type']}/{item['osm_id']}"
        row["fecha_geocodificacion"] = AS_OF
        row["nota_geocodificacion"] = "Punto representativo OSM; no implica sede exacta" if level != "universidad" else "Objeto universitario OSM verificado por nombre y país"
    else:
        row["latitud"] = row["longitud"] = NV
        row["precision_ubicacion"] = "sin ubicación única"
        row["url_geocodificacion"] = row["fecha_geocodificacion"] = NV
        row["nota_geocodificacion"] = "Programa multinacional sin punto único"
    assert set(row) == set(output_fields), row["id"]
    assert row["fecha_ultima_verificacion"] == AS_OF
    assert urlparse(row["url_oficial"]).scheme == "https"
    if row["latitud"] != NV:
        assert -90 <= float(row["latitud"]) <= 90
        assert -180 <= float(row["longitud"]) <= 180

rows.sort(key=lambda r: (r["pais_destino"], r["nombre"], r["id"]))
with (OUT / "becas_limpias_geocodificadas.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=output_fields, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
with (OUT / "deduplicacion.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["id_resultado", "ids_origen", "motivo"], lineterminator="\n")
    writer.writeheader()
    writer.writerows(merge_audit)
with (OUT / "resumen_pais_nivel.csv").open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f, lineterminator="\n")
    writer.writerow(["pais_destino", "nivel", "becas", "fecha_consulta"])
    counts = Counter((r["pais_destino"], level.strip()) for r in rows for level in r["nivel"].split(";"))
    for (country, level), count in sorted(counts.items()):
        writer.writerow([country, level, count, AS_OF])

precision = Counter(r["precision_ubicacion"] for r in rows)
status = Counter(r["estado_convocatoria"] for r in rows)
summary = f"""# Control de calidad — fase 4

Consulta de datos y coordenadas: {AS_OF} (hora de Colombia).

- Entradas fase 3: {len(raw)} registros.
- Salida tras unir modalidades duplicadas: {len(rows)} convocatorias; {len(merge_audit)} fusiones documentadas en `deduplicacion.csv`.
- ID únicos: {len({r['id'] for r in rows})}.
- Estado: {status['abierta']} abiertas, {status['cerrada']} cerradas, {status['recurrente']} recurrentes.
- Precisión geográfica: {precision['universidad']} universidad, {precision['ciudad']} ciudad, {precision['país']} país, {precision['sin ubicación única']} sin punto único.
- Todas las filas conservan URL oficial y fecha de verificación. Los programas `Varios` mantienen coordenadas `No verificado`.
- `resumen_pais_nivel.csv` cuenta cada nivel de un programa multnivel en su categoría; por ello su suma supera el número de convocatorias únicas.

## Decisiones de ubicación

Las coordenadas de país y ciudad son puntos representativos del objeto OSM, no centros académicos ni direcciones de postulación. Solo se asignó nivel universidad a Universidad de los Andes y Tecnológico de Monterrey, cuyos objetos OSM coinciden por nombre y país con sedes indicadas en la convocatoria. Un programa con varios campus, como Monash Graduate Scholarship, queda a escala país. Los demás lugares conocidos se sitúan a escala ciudad; las sedes desconocidas a escala país. Los 29 lugares aprobados y enlaces OSM constan en `geocodigos_aprobados.csv`.

Nominatim se consultó una sola vez por lugar, secuencialmente y con caché, conforme a su [política de uso](https://operations.osmfoundation.org/policies/nominatim/). Datos cartográficos © OpenStreetMap contributors, ODbL 1.0. La aplicación debe mostrar esa atribución al utilizar las coordenadas.

## Límites pendientes

La base sigue siendo una selección verificada, no un censo mundial exhaustivo. Algunos programas paraguas tienen cierres y montos variables por curso o institución. La columna `fecha_ultima_verificacion` se refiere a la ficha oficial de la beca; `fecha_geocodificacion` se refiere a OSM. Los estados son una fotografía del {AS_OF} y deben actualizarse antes de difundirlos como actuales en otra fecha.
"""
(OUT / "control_calidad.md").write_text(summary, encoding="utf-8")
print(f"{len(raw)} filas fuente -> {len(rows)} convocatorias; precisión={dict(precision)}; estados={dict(status)}")
