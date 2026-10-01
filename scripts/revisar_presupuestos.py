"""Aviso de caducidad para precios del piloto; la reconfirmación es manual.

Uso: python scripts/revisar_presupuestos.py [--max-dias 90] [--fecha AAAA-MM-DD]
"""

import argparse
import datetime as dt
import pathlib
import re
import sys


RAIZ = pathlib.Path(__file__).resolve().parents[1]
DATOS = RAIZ / 'src' / 'data' / 'presupuestos.js'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--max-dias', type=int, default=90)
    parser.add_argument('--fecha', type=dt.date.fromisoformat, default=dt.date.today())
    args = parser.parse_args()
    contenido = DATOS.read_text(encoding='utf-8')
    match = re.search(r"FECHA_PRECIOS\s*=\s*'([0-9]{4}-[0-9]{2}-[0-9]{2})'", contenido)
    if not match:
        sys.exit('No se encontró FECHA_PRECIOS en presupuestos.js')
    corte = dt.date.fromisoformat(match.group(1))
    edad = (args.fecha - corte).days
    fuentes = sorted(set(re.findall(r'https://[^\s\'\"]+', contenido)))
    print(f'Precios piloto: {corte}; revisión: {args.fecha}; antigüedad: {edad} días; fuentes oficiales: {len(fuentes)}')
    if edad < 0:
        sys.exit('La fecha de precios está en el futuro.')
    if edad > args.max_dias:
        print('REVISIÓN PENDIENTE: reconfirmar cada precio y cobertura en sus fuentes oficiales, actualizar importes y FECHA_PRECIOS.')
        print('No cambiar la fecha sin verificar las cifras y la vigencia de cada enlace.')
        return 1
    print('La fecha de revisión está dentro del plazo. Los precios pueden cambiar antes; validar siempre al postular.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
