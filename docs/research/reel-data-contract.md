# Contrato de datos de Reels

Estado verificado al 29 de septiembre de 2026. Este documento separa datos oficiales,
datos derivados y ausencias para que la interfaz y el análisis no cambien de significado
entre iteraciones.

## Visualizaciones e interacciones

- `views`, `likes`, `comments`, `shares`, `saved`, `reach` y `total_interactions` llegan
  de Instagram Insights para la pieza conectada. Zenovi no los rotula como
  “sólo Instagram” ni suma Facebook por su cuenta.
- La API v26 no devolvió `facebook_views`, `crossposted_views` ni `reposts` en la cuenta
  de prueba. No se debe inferir el desglose Instagram/Facebook sin una métrica oficial.
- Un futuro desglose por plataforma necesita una cuenta realmente crossposteada y una
  nueva prueba de API; agregar métricas no soportadas al lote actual puede invalidar toda
  la consulta.

## Duración

- Meta no entrega la duración del Reel como insight.
- Cuando existe un archivo reproducible, el navegador lee sólo sus metadatos, valida la
  duración y la guarda una vez en `instagram_media.duration_ms`.
- Biblioteca, detalle y cálculo de retención reutilizan el valor guardado. Las URLs de CDN
  de Meta siguen siendo temporales y no son la fuente persistente de este dato.
- Una pieza restaurada después de archivarse puede conservar portada y métricas pero no
  volver a exponer `media_url`. En ese caso la duración queda ausente; Zenovi no la inventa.

## Evolución y retención

- La evolución de visualizaciones sólo aparece con al menos dos incrementos diarios
  comparables; un único snapshot no forma una curva útil.
- La retención media es `tiempo medio visto / duración verificada`. Si falta cualquiera
  de los dos datos, la interfaz muestra ausencia en lugar de cero.
- Meta no expone por API la curva segundo a segundo, las fuentes de visualización ni el
  drop-off exacto por tramo. Cualquier explicación del análisis sobre abandono debe
  presentarse como hipótesis apoyada en las métricas disponibles, no como causalidad.
