# Control de calidad — fase 4

Consulta de datos y coordenadas: 2026-09-30 (hora de Colombia).

- Entradas fase 3: 46 registros.
- Salida tras unir modalidades duplicadas: 44 convocatorias; 2 fusiones documentadas en `deduplicacion.csv`.
- ID únicos: 44.
- Estado: 12 abiertas, 23 cerradas, 9 recurrentes.
- Precisión geográfica: 2 universidad, 9 ciudad, 31 país, 2 sin punto único.
- Todas las filas conservan URL oficial y fecha de verificación. Los programas `Varios` mantienen coordenadas `No verificado`.
- `resumen_pais_nivel.csv` cuenta cada nivel de un programa multnivel en su categoría; por ello su suma supera el número de convocatorias únicas.

## Decisiones de ubicación

Las coordenadas de país y ciudad son puntos representativos del objeto OSM, no centros académicos ni direcciones de postulación. Solo se asignó nivel universidad a Universidad de los Andes y Tecnológico de Monterrey, cuyos objetos OSM coinciden por nombre y país con sedes indicadas en la convocatoria. Un programa con varios campus, como Monash Graduate Scholarship, queda a escala país. Los demás lugares conocidos se sitúan a escala ciudad; las sedes desconocidas a escala país. Los 29 lugares aprobados y enlaces OSM constan en `geocodigos_aprobados.csv`.

Nominatim se consultó una sola vez por lugar, secuencialmente y con caché, conforme a su [política de uso](https://operations.osmfoundation.org/policies/nominatim/). Datos cartográficos © OpenStreetMap contributors, ODbL 1.0. La aplicación debe mostrar esa atribución al utilizar las coordenadas.

## Límites pendientes

La base sigue siendo una selección verificada, no un censo mundial exhaustivo. Algunos programas paraguas tienen cierres y montos variables por curso o institución. La columna `fecha_ultima_verificacion` se refiere a la ficha oficial de la beca; `fecha_geocodificacion` se refiere a OSM. Los estados son una fotografía del 2026-09-30 y deben actualizarse antes de difundirlos como actuales en otra fecha.
