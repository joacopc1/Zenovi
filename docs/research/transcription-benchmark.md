# Benchmark de transcripción en español

Actualizado: 2026-09-27

## Para qué se hizo

El PRD exige probar proveedores con contenido real antes de elegir uno. Una tabla de
precios no alcanza: toda la lectura posterior del Reel depende de que la transcripción
conserve lo que la persona dijo, los nombres propios y el momento en que lo dijo.

El comparador vive en `scripts/bench-transcription.mjs` y se ejecuta con:

```sh
npm run bench:transcription -- @usuario
```

No escribe en la base ni guarda el video en disco. Pide una URL fresca a Meta, mantiene
el archivo en memoria durante la corrida y muestra las transcripciones en la terminal.

## Muestra válida

- Cuenta: `@samuromero.operator`.
- Reel: publicado el 2 de mayo de 2026.
- Archivo: 7,4 MB.
- Idioma: español rioplatense con términos en inglés y nombres de herramientas.
- Duración aproximada: 1 minuto 30 segundos.

El primer intento con `@elcostarrica` no fue una muestra válida: el Reel no tenía
diálogo. Desde entonces el comparador se niega a sacar conclusiones cuando ningún
proveedor reconoce al menos 20 palabras.

## Resultado

| Proveedor | Modelo | Tiempo | Palabras | Lo que resolvió | Errores visibles |
|---|---|---:|---:|---|---|
| Groq | `whisper-large-v3-turbo` | 2,5 s | 253 | `CTA`, `Loom`, segmentación y timestamps | `ManyChat` |
| Deepgram | `nova-3` | 3,0 s | 250 | Segmentación y timestamps | `CTA` como `STA`, `Loom` como `Zoom`, `ManyChat` |

Los tiempos son los observados en una corrida y no un benchmark de infraestructura. La
comparación que decide es la fidelidad: ambos fueron rápidos, pero Groq conservó mejor
los términos que cambian el significado del análisis.

## Decisión del MVP

Usar **Groq `whisper-large-v3-turbo`** como proveedor inicial de transcripción.

- Devuelve timestamps por segmento o palabra usando `verbose_json`, así que sirve para
  enlazar cada afirmación del análisis con un momento comprobable del video.
- En la muestra propia fue más fiel que Deepgram.
- Su precio publicado al momento de la prueba es US$0,04 por hora de audio.
- Deepgram queda como fallback y referencia de comparación, no como dependencia activa.

La decisión no es irreversible. Antes de escalar se repite sobre una muestra más amplia
de voces, ruido y duraciones. Los nombres de marcas y herramientas —por ejemplo,
`ManyChat`— se enviarán como contexto o glosario cuando el proveedor lo permita.

Fuente: [documentación oficial de Speech-to-Text de Groq](https://console.groq.com/docs/speech-to-text).
