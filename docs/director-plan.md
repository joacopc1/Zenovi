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

- `/director`: lista de chats a la izquierda, conversación en el centro y caja de texto
  abajo, armada con componentes de la colección guardada en 21st.dev.
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
2. **Cuánto se puede usar mientras no haya planes.** Propuesta: 30 mensajes por día y por
   usuario, medir el costo real durante la beta y recién ahí dimensionar créditos.
3. **Modelo por defecto.** Propuesta: Claude Sonnet 5 para conversar y Haiku 4.5 para
   títulos y resúmenes, vía el AI Gateway que ya está configurado.
