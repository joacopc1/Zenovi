# Benchmark de comprensión audiovisual

Actualizado: 2026-09-27

## Qué se quería comprobar

Whisper resuelve audio → texto, pero no sabe qué aparece en un Reel. Esta prueba busca
un modelo que pueda cruzar imagen, voz y texto en pantalla antes de sumar las métricas de
Instagram. No alcanza con una devolución persuasiva: cada afirmación debe traer un
momento comprobable del video.

El comparador vive en `scripts/bench-multimodal.mjs` y se ejecuta con:

```sh
npm run bench:multimodal -- @usuario
```

Pide una URL fresca a Meta, mantiene el archivo en memoria y lo envía inline. No guarda
el video en disco, no usa Gemini Files y no escribe el análisis en Supabase. El envío a
un proveedor externo requiere autorización y sigue sujeto al tratamiento de datos del
plan de API utilizado.

## Muestra

- Cuenta: `@samuromero.operator`.
- Reel: publicado el 2 de mayo de 2026.
- Archivo: 7,4 MB.
- Duración aproximada: 1 minuto 30 segundos.
- Contenido: presentador, subtítulos, grabaciones de pantalla, tablas y automatizaciones.

## Corridas válidas

| Modelo | Tiempo | Entrada | Salida | Total |
|---|---:|---:|---:|---:|
| Gemini 3.7 Flash | 26,8 s | 8.238 tokens | 1.661 tokens | 10.813 tokens |
| Gemini 3.8 Flash | 36,7 s | 8.240 tokens | 1.307 tokens | 10.708 tokens |

El total incluye tokens internos adicionales informados por el proveedor. La corrida de
3.8 usó el mismo esquema que consume la UI real y la Interactions API multimodal
`v1beta`, porque el endpoint estable todavía no acepta video dentro de `user_input`.
El comparador reintenta únicamente errores transitorios y nunca reintenta errores de
esquema o autenticación.

## Evidencia de que procesó lo visual

- Leyó el destaque rojo “Y NO SON LAS VIEWS” en `00:03`.
- Reconoció columnas del tablero, entre ellas `CTA` y `CASH COLLECTED`, en `00:26`.
- Leyó la comparación `250 CHATS / $0` contra `40 CHATS / 5 LLAMADAS / $8.000`.
- Reconoció visualmente `ManyChat`, `Make` y `Airtable` alrededor de `00:59`.
- Separó seis tramos: presentador, pantalla dividida, tabla, panorama del laboratorio,
  automatización y cierre con Loom.
- Identificó el CTA final “Comentá sistema” con evidencia en `01:26`.

El hook verbal y el CTA coinciden con la transcripción independiente de Groq. Los
nombres de herramientas y la estructura de pantallas aportan información que no sale de
una transcripción sola.

## Lectura provisional

**Gemini 3.8 Flash queda como candidato multimodal activo del MVP**, no como elección
definitiva. La salida estructurada fue válida, en español y con timestamps útiles para la
UI de evidencia. También produjo mejoras específicas y verificables sobre el texto y la
legibilidad de las tablas en móvil.

Todavía falta:

- repetir sobre varios Reels y contrastar manualmente cada timestamp;
- comparar contra una segunda alternativa multimodal;
- medir latencia p50/p95, costo real y estabilidad;
- probar prompt injection dentro del audio o del texto en pantalla;
- decidir si el pipeline final usa video directo o frames seleccionados;
- combinar esta lectura visual con la transcripción canónica de Groq y las métricas de
  Meta, sin dejar que el modelo invente cifras.
