# Plan propuesto de mejoras — Atlas/Becas

Estado del proyecto al 2026-09-30: 44 convocatorias; 14 fichas requieren revisión manual y 7 fuentes no respondieron a la consulta automática. La web ya tiene filtros, mapa, fuentes oficiales y diseño adaptable. Este plan mejora la decisión de postular sin exponer un CSV público.

## Lista priorizada

| ID | Mejora | Prioridad | Esfuerzo relativo | Dependencia |
| --- | --- | --- | --- | --- |
| M1 | Mostrar fecha de verificación y advertencia de datos pendientes en cada ficha | Alta | M | Datos actuales |
| M2 | Revisar las 14 fichas pendientes y reintentar las 7 fuentes inaccesibles | Alta | Continuo | Fuentes oficiales |
| M3 | Vistas rápidas «Abiertas ahora», «Cierran pronto» y «Recurrentes» | Alta | M | M1; fechas fiables |
| M4 | Ordenar resultados por cierre, país y nivel | Alta | S | M3 |
| M5 | Ficha detallada con requisitos, idioma, monto, cobertura, plazo, fuente y precisión geográfica | Alta | M | M1 |
| M6 | Alternar lista/mapa en móvil, conservando filtros y selección | Alta | M | Ninguna |
| M7 | Favoritos locales sin cuenta | Media | S | IDs estables |
| M8 | Comparar hasta tres becas lado a lado | Media | M | M5 y M7 |
| M9 | Añadir un cierre confirmado al calendario mediante un archivo ICS de día completo | Media | S | M1 y M5 |
| M10 | Afinar estados vacíos, navegación con teclado, contraste y movimiento reducido | Media | S–M | M3–M6 |
| M11 | Medir uso del sitio y clics a fuentes oficiales con GA4 | Media | M | Objetivos, privacidad y consentimiento |

S = pequeño; M = mediano. Son tamaños relativos, no promesas de duración.

## Etapa 1 — Vigencia y descubrimiento

**Alcance:** M1–M4. Revisar primero fuentes pendientes, distinguir «fecha verificada» de «fecha calculada» y evitar llamar «abierta ahora» a una convocatoria cuya edición actual no está confirmada. Añadir accesos rápidos y ordenamiento sin perder los filtros existentes.

**Entrega implementada (2026-09-30):** fichas con fecha y estado claros; accesos rápidos que actualizan lista, mapa y conteos a la vez. Revisión de 14 fichas documentada en `REVISION_ETAPA1.md`; 2 continúan pendientes.

**Aceptación:** una fecha vencida no aparece como abierta; las fichas pendientes se identifican sin abrir la fuente; los filtros y el orden funcionan en escritorio y móvil. Se documentan las fichas que siguen sin respuesta oficial.

## Etapa 2 — Fichas y experiencia móvil

**Alcance:** M5, M6 y M10. Incorporar un panel de detalle con todos los campos útiles, «No verificado» cuando corresponda y un único enlace principal a la fuente oficial. En móvil, ofrecer un cambio claro entre lista y mapa. Refinar los estados vacíos y la accesibilidad.

**Entrega:** vista de detalle y navegación móvil más cómoda, conservando el diseño editorial.

**Aceptación:** se puede llegar al detalle y volver con teclado; el panel explica la precisión del marcador; alternar lista/mapa no borra filtros; no hay desbordamiento horizontal ni animación obligatoria si el usuario prefiere movimiento reducido.

## Etapa 3 — Guardar y actuar

**Alcance:** M7–M9. Guardar favoritos en `localStorage`, comparar un máximo de tres becas y exportar al calendario únicamente cierres con fecha confirmada. El ICS será un evento de día completo porque la mayoría de las fuentes no publican una hora o zona horaria fiable.

**Entrega:** lista de favoritos, comparador y botón de calendario en las fichas elegibles.

**Aceptación:** favoritos sobreviven a recargar la página y no requieren cuenta; una beca retirada se identifica en favoritos; la comparación muestra también datos faltantes; el calendario incluye enlace oficial y advertencia de reconfirmar el plazo.

## Etapa 4 — Analítica con propósito

**Alcance:** M11. Definir tres preguntas antes de instalar GA4: qué destinos y niveles interesan, dónde se producen cero resultados y qué fichas llevan a la fuente oficial. Medir filtros por categoría y clics externos, sin enviar texto libre de búsqueda ni datos personales. Configurar consentimiento y una nota de privacidad. Verificar en DebugView las vistas de `HashRouter` para evitar páginas omitidas o duplicadas.

**Entrega:** eventos y un tablero pequeño con interés por destino/nivel, tasa de cero resultados y clics hacia fuentes oficiales. Un clic externo mide interés, no una postulación terminada.

**Aceptación:** la web funciona sin aceptar analítica; no se envía texto libre; cada cambio de ruta genera como máximo una vista; los eventos sirven para decidir una mejora concreta tras un periodo de observación.

Referencias técnicas: [medición de clics externos](https://support.google.com/analytics/answer/13566436?hl=en), [SPA en GA4](https://developers.google.com/analytics/devguides/collection/ga4/single-page-applications), [Consent Mode](https://support.google.com/analytics/answer/10000067?hl=en) y [política de datos personales](https://support.google.com/analytics/answer/6366371?hl=en).

## Orden de ejecución

1. Etapa 1: confianza y descubrimiento.
2. Etapa 2: detalle y móvil.
3. Etapa 3: favoritos, comparación y calendario.
4. Etapa 4: analítica; instalarla cuando estén definidos los eventos y el consentimiento.

Se valida cada etapa en la versión local y en GitHub Pages antes de iniciar la siguiente. La actualización de fuentes oficiales continúa durante todas las etapas.

## Decisiones antes de implementar

- Confirmar este orden de etapas.
- Elegir el plazo que dispara «Cierran pronto» (propuesta: 30 días).
- Para GA4, facilitar un ID de medición `G-...` y aprobar el texto de privacidad cuando llegue la etapa 4.
