# Guías del Director

Material de capacitación que el Director lee **sólo cuando la conversación lo necesita**:
si le piden un guion, lee la guía de guiones; si sólo charlan, no la paga. Así podemos
cargarle mucho conocimiento sin que cada mensaje cueste más (ver `docs/director-plan.md`).

## Cómo sumar una guía

1. Escribir el archivo en esta carpeta, en Markdown: `guiones.md`, `ideas.md`, `trial-reels.md`…
2. Registrarla en `index.ts` con su `slug` (el nombre del archivo sin `.md`), un título y
   **cuándo usarla**, en una frase. Esa frase es lo que el Director lee para decidir si la
   consulta, así que tiene que describir el pedido del creador, no el contenido de la guía.
3. Correr los tests: comprueban que cada guía registrada exista.

Escribirlas como instrucciones para un estratega, no como un artículo: qué hacer, en qué
orden, con ejemplos buenos y malos. Lo que vale para todas las conversaciones (cómo habla,
cómo piensa) no va acá sino en `../training.ts`.
