# Plan del Director

Fecha: 2026-10-01. Estado: propuesta, pendiente de que Joaco cierre las tres decisiones del final.

El Director es el chat con IA que conoce la marca, la oferta, la audiencia y los números
reales de la cuenta, y los convierte en decisiones, ideas y guiones. Es el núcleo del
producto (PRD §10.7, MVP Epic G) y lo que destraba Producción: "guardar esta idea" y
"llevar una pieza al Director" no pueden existir sin él.

## Lo que ya está y se reutiliza

- **ADN de marca** en `/brand`, con `brand_profiles`, `offers` y `audience_profiles` bajo RLS.
- **Contenido medido**: Reels, Posts y secuencias de Historias, con métricas, benchmarks
  propios, análisis y guiones guardados.
- **Infraestructura de IA**: AI SDK con AI Gateway y respaldo entre modelos
  (`lib/ai/gateway-*`), y un manejo de errores de proveedor que ya da mensajes legibles.
- **Producción**: `content_items.source` ya distingue `manual` de `director`.
- **Entrada**: la barra lateral y el botón "Director IA" del encabezado ya apuntan a
  `/director`, que todavía no existe.

## Principio de construcción

Primero la interfaz, después la lógica, porque Joaco define qué tiene que hacer el
Director viéndolo en pantalla. Cada fase se puede usar al terminar y se sube por separado.

## Fases

### 1. La pantalla, con la conversación funcionando de verdad

- `/director`: conversación en el centro con la caja de texto abajo, y la lista de chats
  a la **derecha** (a la izquierda ya está la barra lateral de la app: dos listas del mismo
  lado se leerían como un solo menú). Armada con componentes de la colección guardada en
  21st.dev.
- **Estado vacío** con tres o cuatro preguntas de arranque armadas con los datos de la
  cuenta ("¿Por qué el Reel del 28 rindió el doble?").
- Respuestas **en tiempo real**, a medida que se escriben.
- Chats **guardados** (tablas `director_chats` y `director_messages` con RLS por
  workspace): crear, reabrir, renombrar, archivar y borrar. El título se genera solo.
- El Director ya habla **sabiendo el ADN** de la marca desde el primer mensaje.
- **Tope provisional** de mensajes por día y por usuario, hasta tener créditos.

### 2. Que conozca la cuenta, no sólo la marca

- Herramientas de lectura que el Director usa cuando las necesita: buscar contenido,
  métricas de una pieza contra lo habitual, análisis guardados, secuencias de Historias
  y totales de un período de Analíticas. Cada herramienta revalida sesión y workspace en
  el servidor.
- **Citas**: cuando habla de un Reel, la cita es un chip que abre ese Reel.
- **Agregar contexto** desde la caja de texto: un Reel, una secuencia, una idea de
  Producción o un período.
- Distingue un dato confirmado de una inferencia, y dice cuando no tiene el dato.

### 3. Que actúe

- **Guardar en Producción**: "agregá esta idea" crea la tarjeta en estado idea, con su
  porqué y `source = director`. Pide confirmación antes de escribir.
- **Llevar al Director** desde una tarjeta de Producción, y **Preguntar al Director**
  desde el detalle de un Reel o una secuencia: abre un chat con esa pieza ya cargada.

### 4. Memoria y costo

- Resumen acumulado de chats largos, para no reenviar todo el historial en cada turno.
- Decisiones y preferencias que el creador confirma, guardadas y reutilizadas.
- Créditos por operación: se reservan antes y se reconcilian después. Sin saldo, el
  historial sigue visible.
- Prompt caching de la capacitación y elección de modelo según la tarea: uno avanzado para
  estrategia y guiones, uno rápido para títulos y resúmenes.

### Después del MVP

Adjuntos temporales (imagen o documento con alcance del chat), chat temporal, carpetas
con instrucciones propias y acciones automatizadas con aprobación.

## Seguridad

- Captions, transcripciones y textos de Historias son **datos, no instrucciones**: van
  marcados como contenido del creador y el Director nunca obedece lo que digan.
- El modelo no ve secretos ni ids internos que no necesite; las herramientas reciben
  argumentos validados con esquema y comprueban permisos en el servidor.
- Las acciones de escritura piden confirmación humana.
- Límite de pasos, tiempo y costo por respuesta.

## Decisiones que necesita Joaco antes de la fase 1

1. **La capacitación del Director** (decisión del 2026-09-21: es una capa distinta del
   ADN). Propuesta: vive en archivos versionados del repositorio (`lib/director/training/`),
   común a todas las cuentas; el ADN se suma por cuenta en cada conversación. Falta definir
   **qué sabe del rubro**: tipos de contenido y para qué sirve cada uno, Trial Reels,
   cómo se piensa una marca personal o un infoproducto. ¿Lo arma Joaco con material del
   mercado, lo redacto yo y él corrige, o una mezcla?
2. **Cómo se mide el uso (propuesta del 2026-10-01).** No por mensaje: una pregunta corta y
   un guion con todo el contexto de la cuenta cuestan diez veces distinto. Una sola moneda,
   "créditos": las acciones grandes (analizar un Reel o una secuencia, generar un guion)
   tienen precio fijo y visible antes de hacerlas; el chat descuenta según su costo real y
   el creador ve una barra de cuánto le queda en el mes, con aviso al 80 % y sin cortar una
   respuesta a la mitad. Por dentro, cada operación guarda su costo real. En la beta, tope
   generoso sin mostrar la moneda; los créditos se dimensionan con el costo medido.
3. **Modelo.** Costo estimado por respuesta del Director (capacitación y ADN en caché, unos
   20k tokens de entrada y 1,8k de salida): Haiku 4.5 ~US$0,02, **Sonnet 5 ~US$0,045**,
   Opus 5.5 ~US$0,09, Opus 5 ~US$0,11. Propuesta: Sonnet 5 para conversar, Haiku 4.5 para
   títulos y resúmenes, Opus como "análisis profundo" más adelante. Medir con
   conversaciones reales antes de fijar precios (Fase 3 del roadmap).

## Diseño de la pantalla

Base de estructura: el componente `animated-ai-chat` de 21st.dev que trajo Joaco (saludo
centrado, caja que crece, comandos con "/", sugerencias en chips, indicador de "pensando"),
adaptado a los tokens de Zenovi (claro, tinta y papel, sin el violeta ni las manchas que
siguen al mouse). Comandos propios: `/idea`, `/guion`, `/analizar`, `/plan`. Lista de chats
a la derecha.

**Nombre propio o mascota del agente** (tipo "Zenovi AI", con un 3D): idea de Joaco a
analizar después del MVP; no bloquea nada.
