"""Consulta única y cacheada de lugares de los CSV de fase 3 en Nominatim.

Respeta la política pública: un hilo, máximo una consulta por segundo, agente
identificable y caché persistente. No forma parte de actualizaciones periódicas.
"""
import csv
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "fase3"
OUT = ROOT / "data" / "fase4"
CACHE = OUT / "candidatos_nominatim.json"
NV = "No verificado"
CODES = {
    "Alemania": "de", "Australia": "au", "Canadá": "ca", "Chile": "cl",
    "China": "cn", "Colombia": "co", "Corea del Sur": "kr", "España": "es",
    "Estados Unidos": "us", "Francia": "fr", "India": "in", "Japón": "jp",
    "México": "mx", "Países Bajos": "nl", "Reino Unido": "gb",
    "Singapur": "sg", "Suecia": "se",
}
COUNTRY_EN = {
    "Alemania": "Germany", "Australia": "Australia", "Canadá": "Canada", "Chile": "Chile",
    "China": "China", "Colombia": "Colombia", "Corea del Sur": "South Korea", "España": "Spain",
    "Estados Unidos": "United States", "Francia": "France", "India": "India", "Japón": "Japan",
    "México": "Mexico", "Países Bajos": "Netherlands", "Reino Unido": "United Kingdom",
    "Singapur": "Singapore", "Suecia": "Sweden",
}
SKIP_UNIVERSITIES = {"CEDEU / Universidad Rey Juan Carlos", "Centro para el Desarrollo de Computación Avanzada Mohali"}

OUT.mkdir(parents=True, exist_ok=True)
with (SRC / "indice.csv").open(encoding="utf-8-sig", newline="") as f:
    block_files = [SRC / r["archivo"] for r in csv.DictReader(f)]
rows = []
for file in block_files:
    with file.open(encoding="utf-8-sig", newline="") as f:
        rows.extend(csv.DictReader(f))

queries = {}
for r in rows:
    country = r["pais_destino"]
    if country not in CODES:
        continue
    cc = CODES[country]
    queries[f"pais|{country}"] = {"country": COUNTRY_EN[country], "featuretype": "country", "format": "jsonv2", "addressdetails": 1, "limit": 3}
    city = r["ciudad"]
    if city != NV:
        queries[f"ciudad|{country}|{city}"] = {"city": city, "country": COUNTRY_EN[country], "countrycodes": cc, "format": "jsonv2", "addressdetails": 1, "limit": 3}
    uni = r["universidad"]
    if uni != NV and uni not in SKIP_UNIVERSITIES and "/" not in uni:
        queries[f"universidad|{country}|{uni}"] = {"q": f"{uni}, {city if city != NV else COUNTRY_EN[country]}, {COUNTRY_EN[country]}", "countrycodes": cc, "format": "jsonv2", "addressdetails": 1, "limit": 3}

cache = json.loads(CACHE.read_text(encoding="utf-8")) if CACHE.exists() else {}
last_call = 0.0
for key, params in sorted(queries.items()):
    if key in cache:
        continue
    elapsed = time.monotonic() - last_call
    if elapsed < 1.2:
        time.sleep(1.2 - elapsed)
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={
        "User-Agent": "BecasColombiaDataResearch/0.1 (https://github.com/gara501/becas)",
        "Accept-Language": "en",
    })
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = json.load(response)
    except Exception as exc:
        print(f"ERROR {key}: {exc}", flush=True)
        continue
    last_call = time.monotonic()
    cache[key] = [
        {k: item.get(k) for k in ("osm_type", "osm_id", "lat", "lon", "category", "type", "addresstype", "name", "display_name", "address", "importance")}
        for item in raw
    ]
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{key}: {len(raw)} candidatos", flush=True)
print(f"{len(cache)}/{len(queries)} consultas en caché")
