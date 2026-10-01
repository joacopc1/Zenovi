# Proveedores de IA de Zenovi

Cada modelo se paga directo a su proveedor. Los identificadores viven en `lib/ai/models.ts`;
los precios que se usan para descontar créditos, en `lib/credits/pricing.ts`.

| Uso | Modelo | Proveedor | Variable |
| --- | --- | --- | --- |
| Chat del Director | `claude-sonnet-5-5` | Anthropic | `ANTHROPIC_API_KEY` |
| Títulos de chats y resúmenes | `claude-haiku-4-5` | Anthropic | `ANTHROPIC_API_KEY` |
| Análisis de Reels, Historias y guiones | `gemini-3.8-flash` (respaldo `gemini-3.7-flash`) | Google | `GEMINI_API_KEY` |
| Respaldo si Gemini falla | `claude-sonnet-5-5` con los fotogramas | Anthropic | `ANTHROPIC_API_KEY` |
| Transcripción | `whisper-large-v3-turbo` | Groq | `GROQ_API_KEY` |

## Anthropic

1. En [platform.claude.com](https://platform.claude.com) → Claves de API, crear una clave.
   Conviene un espacio de trabajo propio de Zenovi con tope de gasto mensual.
2. Cargar saldo en Facturación: sin saldo, la API rechaza los pedidos.
3. Guardar la clave como `ANTHROPIC_API_KEY` en `.env.local` y en las variables de entorno
   de Vercel (Production), y volver a desplegar.

La clave se muestra una sola vez. Nunca va en el código, en el repositorio ni en un chat.

## Por qué no usamos Vercel AI Gateway

El Gateway no cobra recargo sobre los tokens, pero exige comprar créditos de Vercel incluso
para usar una clave propia, y suma un intermediario. Decidido el 2026-10-02: los modelos de
Claude van directo a Anthropic. El código usa el AI SDK, así que volver al Gateway es cambiar
el proveedor en una línea.
