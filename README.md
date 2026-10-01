# Atlas/Becas

Mapa interactivo y base verificada de becas elegibles para personas colombianas. Corte de datos: **30 de septiembre de 2026**. La base contiene **44 convocatorias únicas** en **17 países de destino**, más dos programas de destino múltiple. Los estados son 12 abiertas, 23 cerradas y 9 recurrentes a la fecha de corte; consulta siempre el enlace oficial antes de postular.

## Abrir el mapa

1. Abre [dist/index.html](dist/index.html) directamente en un navegador. No requiere servidor, cuenta ni clave de mapas.
2. El CSV descargable está junto al archivo, en [dist/becas.csv](dist/becas.csv).
3. El archivo HTML contiene React, estilos, datos y límites del mapa. Google Sans se carga cuando hay conexión; existe una tipografía alternativa local.

Para reconstruir la distribución desde el repositorio:

```powershell
npm ci
npm run build
```

Para desarrollo: `npm run dev`. El build incluye React 19, React Router, Motion, Tailwind y React Leaflet con grupos de marcadores. La vista mundial colorea los destinos por número de convocatorias (1, 2–4, 5 o más). Al elegir un país, muestra marcadores de becas, agrupa puntos coincidentes y abre la fuente oficial desde cada ficha.

## Datos y trazabilidad

- Base depurada: [data/fase4/becas_limpias_geocodificadas.csv](data/fase4/becas_limpias_geocodificadas.csv).
- Resumen por país y nivel: [data/fase4/resumen_pais_nivel.csv](data/fase4/resumen_pais_nivel.csv).
- Control de calidad y limitaciones: [data/fase4/control_calidad.md](data/fase4/control_calidad.md).
- Coordenadas aprobadas y evidencia OSM: [data/fase4/geocodigos_aprobados.csv](data/fase4/geocodigos_aprobados.csv).
- Bloques originales por destino: [data/fase3/README.md](data/fase3/README.md).

Cada registro incluye `url_oficial`, `fuente_de_verificacion` y `fecha_ultima_verificacion`. La página **Fuentes** del mapa enlaza las 44 fichas. Los programas multinacionales sin destino puntual siguen visibles en la lista.

El mapa usa límites de [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/) y coordenadas de [OpenStreetMap](https://www.openstreetmap.org/copyright). Los puntos a nivel de país o ciudad son representativos; no implican la ubicación de una universidad. Una beca puede cubrir varios niveles, de modo que la suma de la tabla país/nivel puede exceder 44. La base es una selección verificada y no un censo exhaustivo.

## Actualización a demanda

Instala las dependencias una vez y ejecuta un solo comando cuando quieras consultar las fuentes de nuevo:

```powershell
python -m pip install -r requirements-update.txt
npm ci
npm run actualizar
```

El comando consulta las URL oficiales, reutiliza los identificadores HTTP y huellas de la consulta anterior, limita las solicitudes por dominio, regenera el CSV y reconstruye el HTML. No repite la búsqueda, deduplicación ni geocodificación de las fases anteriores. También puedes consultar una ficha con `python scripts/actualizar_becas.py --solo-id ID` o limitar una prueba con `--max 5`.

Revisa estos archivos después de cada ejecución:

- [base actualizada](data/actualizaciones/becas_actualizadas.csv): parte de los 44 registros iniciales y cierra automáticamente una edición con fecha de cierre verificada ya vencida.
- [última consulta](data/actualizaciones/ultima_consulta.csv): respuesta HTTP, cambios detectados y fichas que necesitan revisión.
- [fechas candidatas](data/actualizaciones/candidatos_fecha.csv): fechas encontradas cerca de expresiones de cierre, con contexto. Son sugerencias, no datos publicados.
- [resumen](data/actualizaciones/resumen.json): número de consultas, errores y pendientes.

Para confirmar una nueva edición, completa una fila de [revisiones_confirmadas.csv](data/actualizaciones/revisiones_confirmadas.csv). Usa el ID, `accion=actualizar`, fechas en formato `AAAA-MM-DD`, `url_evidencia` oficial HTTPS y `fecha_verificacion`. `url_oficial_nueva` permite reemplazar un enlace antiguo. Para retirar una beca que ya no admite colombianos, usa `accion=retirar` y explica el motivo en `nota`; el retiro queda documentado en `retiros.csv`. Después ejecuta:

```powershell
python scripts/actualizar_becas.py --sin-red --aplicar-revisiones data/actualizaciones/revisiones_confirmadas.csv
npm run build
```

El script nunca adopta por sí solo una fecha encontrada en una página índice, ni afirma haber verificado nuevamente elegibilidad, montos o requisitos. Las fichas que bloquean consultas automáticas y los cambios ambiguos quedan en la cola de revisión. El mapa muestra el corte de verificación más antiguo y la fecha de la última consulta automatizada por separado.

## Verificación de la interfaz

```powershell
node scripts/qa_ui.mjs
```

La prueba abre el HTML final mediante `file://` en Chrome y verifica filtros, rutas, mapa y ancho móvil. Las capturas quedan en `.tmp/`. Requiere Chrome en la ruta indicada en el script.

## Estado del proyecto

Fases 1 a 6 completadas. La primera consulta completa de fase 6 encontró 7 sitios inaccesibles desde el script y dejó 14 fichas para revisión; los valores originales se conservaron. El proceso incremental permite repetir la consulta o revisar solo esas fichas sin rehacer la base.
