# Fase 3 — bloques por país de destino

Consulta y verificación: **2026-09-30** (hora de Colombia). Se entregan **46 registros en 18 bloques**. Cada CSV usa las mismas 30 columnas de `data/piloto_20.csv`; `indice.csv` resume los conteos y el estado declarado de cada bloque. Los 20 registros del piloto aparecen una sola vez.

## Lectura de estados

- `abierta`: el plazo publicado aún no había vencido en la fecha de consulta y la convocatoria se presentaba como vigente.
- `cerrada`: el cierre publicado ya había pasado o la fuente indica que no acepta solicitudes.
- `recurrente`: programa que se repite, con próxima apertura conocida o con plazos que dependen de la universidad o consorcio. **No equivale a postulación abierta.**

Totales: **12 abiertas, 25 cerradas, 9 recurrentes**. Las fechas están marcadas como sujetas a cambio anual. `No verificado` es literal cuando la fuente oficial no sustenta un valor. Las coordenadas permanecen sin verificar para la fase 4.

## Alcance y límites

- Esta entrega amplía la muestra inicial y cubre todos los países prioritarios, además de otros destinos. No representa un censo exhaustivo de becas mundiales.
- Los programas paraguas (Erasmus Mundus, NL Scholarship, Fundación Carolina, COLFUTURO, SI) requieren revisar la ficha específica del curso o universidad antes de postular. Cuando la postulación es institucional, está indicada en `requisitos_clave` y `notas`.
- El programa Maastricht NL-High Potential **incluye** un componente NL Scholarship; son oportunidades de solicitud diferenciadas, pero sus montos no deben sumarse. Los niveles separados de Minciencias 975 y CSC Type A son modalidades de una misma convocatoria; sus notas señalan cómo evitar inflar el número de convocatorias.
- Las rutas de los fondos ICETEX Álvaro Ulcué Chocué y Comunidades Negras se representan en el bloque Colombia; sus fuentes también permiten determinadas modalidades en el exterior.
- El apoyo Quiero Estudiar de Uniandes exige un compromiso de devolución ligado a ingresos; su `tipo_financiacion` lo distingue de una beca sin devolución.
- `pais_destino=Varios` evita asignar arbitrariamente un país a Erasmus Mundus o COLFUTURO.

## Procedencia

Las columnas `url_oficial` y `fuente_de_verificacion` contienen el enlace oficial consultado para cada fila. `fecha_ultima_verificacion` registra la consulta; `evidencia_elegibilidad_colombianos` explica por qué la oportunidad incluye a personas colombianas. No se usaron agregadores como prueba de elegibilidad.

Las exclusiones documentadas se encuentran en `exclusiones.csv` y **no** forman parte de los 46 registros.
