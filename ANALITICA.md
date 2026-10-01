# Analítica del atlas

La medición es opcional. El ID público `G-0774MSJ1QZ` está en `.env.production` y Netlify compila `dist/` mediante `netlify.toml`. Un valor `VITE_GA_MEASUREMENT_ID` definido en **Site configuration → Environment variables** puede sustituirlo en el build. Sin un ID válido (`G-...`), el sitio no carga Google Analytics ni muestra el aviso. Al abrir el HTML local mediante `file://`, la analítica también queda desactivada para evitar enviar rutas del equipo de la persona. El ID de medición es público por naturaleza; no coloques claves privadas en variables `VITE_`.

## Consentimiento y privacidad

La etiqueta de Google se añade al documento **solo después** de que la persona pulse «Permitir analítica» en la versión publicada por HTTP(S). «Solo esenciales» mantiene el atlas funcional sin cargarla. La elección se guarda en `localStorage`; se puede cambiar desde el pie de página. Al retirar un consentimiento ya otorgado, la página se recarga para retirar el script de la sesión activa. No se envía el texto libre de búsqueda ni la lista de becas guardadas.

Se declara Consent Mode con todos los permisos denegados antes de configurar la etiqueta; únicamente `analytics_storage` pasa a permitido tras aceptar. Señales y personalización publicitaria permanecen desactivadas. Consulta la [guía oficial de Consent Mode](https://developers.google.com/tag-platform/security/guides/consent).

## Eventos y preguntas

| Pregunta | Evento | Parámetros seguros | Lectura correcta |
| --- | --- | --- | --- |
| ¿Qué destinos y niveles interesan? | `explore_filters` | `destination`, `study_level`, `study_area`, `coverage`, `application_status`, `closing_month`, `quick_view`, `has_search`, `results_count` | Preferencias de filtro entre visitantes que aceptaron la analítica. |
| ¿Dónde se obtienen cero resultados? | `no_results` | Los mismos parámetros, sin texto libre | Combinaciones de filtros que terminan sin becas. |
| ¿Qué fichas llevan a la fuente? | `official_link_click` | `scholarship_id`, `destination`, `link_context` | Clic de salida, **no** postulación completada. |
| ¿Qué páginas se usan? | `page_view` | `page_location`, `page_title`, `page_referrer` | Una vista por navegación del `HashRouter`. |

`explore_filters` y `no_results` se emiten tras 700 ms sin cambios para no contar cada tecla. La búsqueda solo aporta `has_search=true/false`. `link_context` es `tarjeta`, `ficha`, `mapa`, `fuentes` o `comparacion`. Los clics en atribuciones del mapa y las exclusiones metodológicas no son `official_link_click`.

## Tablero pequeño en GA4

Crea tres pestañas en **Explorar → Forma libre**. Registra antes las dimensiones personalizadas de ámbito **Evento** para `destination`, `study_level`, `quick_view`, `link_context` y `scholarship_id`; GA4 requiere ese paso para mostrar parámetros personalizados en los informes. Usa `Nombre del evento` y `Número de eventos` como dimensión y métrica base.

1. **Interés:** filtra `explore_filters`; filas `destination` y `study_level`; métrica `Número de eventos`.
2. **Sin resultados:** compara `no_results` con `explore_filters` por `destination` y `study_level`. La tasa se calcula como `no_results / explore_filters` para los mismos filtros y periodo. Representa estados de filtros, no porcentaje de personas.
3. **Salida oficial:** filtra `official_link_click`; filas `destination`, `scholarship_id` y `link_context`; métrica `Número de eventos`.

Lee esas cifras después de un periodo de observación y con el volumen suficiente. La cobertura del tablero incluye solo visitantes que aceptaron la analítica.

## Evitar páginas duplicadas

El código envía `page_view` manualmente al cambiar de ruta y usa `send_page_view: false`. En el flujo web de GA4 desactiva **Medición mejorada → Vistas de página → Cambios de página basados en eventos de historial**; Google indica que esa opción puede producir vistas automáticas incluso con `send_page_view: false`. Verifica una vista por navegación en DebugView o Tag Assistant con `/`, `/#/fuentes`, `/#/metodo` y `/#/privacidad`. Referencias: [SPA](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications), [control de vistas](https://developers.google.com/analytics/devguides/collection/ga4/views), [parámetros personalizados](https://developers.google.com/analytics/devguides/collection/ga4/event-parameters).

## Verificación local

Ejecuta `npm run build` y `node scripts/qa_analytics.mjs`. La prueba intercepta el script de Google; comprueba que no se solicita antes de aceptar, que la denegación deja el sitio usable, que las rutas no se duplican y que los eventos no incluyen texto libre. El DebugView real queda pendiente hasta configurar un ID de GA4 propio.
