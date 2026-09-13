# Zenovi - Fundamentos de diseño de producto

Actualizado: 2026-09-10

Estado: dirección provisional pendiente de validar visualmente. No constituye todavía un sistema de diseño definitivo.

## Intención

Zenovi está pensado para un coach, infoproductor o creador que abre la aplicación entre sesiones, grabaciones y decisiones comerciales. Necesita entender qué funcionó, qué hacer después y convertir una idea en una pieza publicable sin sentirse dentro de una herramienta técnica de analítica.

La interfaz debe sentirse como una dirección de marketing silenciosa y precisa: estratégica, premium, serena y accionable. No debe parecer una red social, un tablero genérico de métricas ni un chatbot con pantallas agregadas alrededor.

## Exploración del dominio

Conceptos propios del producto:

- Señal frente a ruido.
- Hooks y primeros segundos.
- Narrativa y secuencia.
- Autoridad y confianza.
- Intención comercial.
- Conversión.
- Ciclos de aprendizaje.
- Banco de ideas y producción.

## Mundo cromático

Colores que pertenecen a esta dirección:

- Negro tinta: autoridad, marca y decisiones firmes.
- Blanco papel: claridad para leer y trabajar.
- Grafito: navegación y jerarquía secundaria.
- Gris niebla: separación silenciosa y estados vacíos.
- Negro de señal: acciones, títulos y hallazgos prioritarios.
- Verde contenido: éxito o mejora confirmada, nunca decoración.
- Ámbar: atención, consumo o datos incompletos.

## Defaults rechazados

- Brief editorial dominante en Inicio: se reemplaza por un dashboard útil; la lectura del Director aparece como módulo secundario y accionable.
- Sidebar aislado con otro mundo visual: se reemplaza por un shell continuo unido al header, inspirado en el comportamiento de Glovi.
- Chatbot flotante como centro del producto: el Director vive como módulo principal y como asistente contextual.
- Colores por cada módulo: la interfaz es monocromática; el color aparece únicamente para estados semánticos, enlaces o foco.

## Tema y superficies

### MVP

- Light-first.
- Canvas exterior gris cálido muy claro.
- Sidebar y header comparten exactamente la misma superficie.
- El área de trabajo aparece como una hoja elevada mediante cambio sutil de superficie, borde tenue y radio solo en la esquina de unión.
- Cards del mismo color que el fondo inmediato, diferenciadas por un borde gris muy sutil.
- Cards seleccionables: fondo gris del canvas en hover y persistente durante la selección. Cards informativas: superficie estable. No usar el hover para sugerir interacción donde no existe.
- Profundidad basada principalmente en bordes suaves; sombras únicamente en popovers, modales y menús flotantes.

### Dark mode

Los tokens y contrastes deben contemplarse desde el comienzo, pero la implementación y QA completos pueden quedar fuera del MVP. Esta decisión evita duplicar estados visuales mientras se valida el producto. El modo oscuro no debe ser una simple inversión automática.

## Tipografía

- Familia principal: `Instrument Sans Variable`, usando el archivo variable y sus pesos reales.
- Headlines: peso 600-700, tracking ligeramente negativo.
- Texto de interfaz: peso 400-500.
- Labels: peso 500-600, sin abusar de mayúsculas.
- Datos tabulares: cifras tabulares de Instrument Sans cuando sean suficientes; evaluar una monoespaciada solo si mejora tablas densas.

## Shell de aplicación

Referencia funcional: sidebar de LeadsRover y continuidad sidebar/header de Glovi.

- Sidebar expandido aproximado: 220-232 px.
- Sidebar colapsado futuro: 72 px.
- Header global: 56 px.
- Wordmark tipográfico `Zenovi` y control de colapsado arriba a la izquierda.
- Perfil activo de Instagram debajo, con imagen de Instagram cuando existe, `@usuario` y chevrones verticales.
- En MVP el selector muestra un único perfil. `Añadir perfil · Próximamente` comunica la extensión futura sin habilitarla.
- Perfil personal de autenticación separado en el extremo derecho del header.
- Navegación agrupada por intención, no por tecnología.

Estructura aprobada para el corte actual:

1. Inicio.
2. Observar: Analíticas, Contenido.
3. Decidir: Director.
4. Crear: Baúl, Calendario.
5. Setup: ADN de marca, Ajustes.

La IA contextual puede abrirse desde cualquier objeto sin duplicar una navegación completa.

## Tokens provisionales

| Token | Light | Uso |
|---|---:|---|
| `--zen-canvas` | `#F1F0ED` | Shell exterior |
| `--zen-paper` | `#FFFEFC` | Área principal |
| `--zen-ink` | `#111113` | Texto y marca |
| `--zen-graphite` | `#5E5E66` | Texto secundario |
| `--zen-mist` | `#E8E7E3` | Bordes/superficies |
| `--zen-signal` | `#111113` | Acción/hallazgo |
| `--zen-link` | `#2463EB` | Enlace o foco cuando sea necesario |
| `--zen-success` | `#238A5A` | Mejora confirmada |
| `--zen-warning` | `#A86511` | Atención/consumo |
| `--zen-danger` | `#C33C45` | Error/destructivo |

Escala base de espaciado: 4 px. Radios: 8 px controles, 12 px cards, 16 px paneles, 20-24 px popovers o superficies principales justificadas.

El borde estándar de card equivale a `1px solid rgba(0, 0, 0, 0.10)`. La referencia de ElevenLabs midió el mismo negro al 10 %; su ancho fraccionario computado se atribuye al escalado/renderizado. Zenovi conserva su radio propio de 14 px en vez de copiar los 20 px de esa card.

## Principios para datos

- Toda métrica debe responder `qué significa` y `qué hago ahora`.
- Diferenciar dato oficial, cálculo de Zenovi, inferencia de IA y estimación.
- Mostrar comparación contra el propio histórico antes que benchmarks genéricos.
- No fabricar precisión: incluir fuente, rango, actualización y confianza.
- Los gráficos deben admitir vacío, carga, error, parcialidad y falta de permisos.

## Estados obligatorios

Cada pantalla y componente relevante debe diseñarse para:

- Carga inicial y actualización.
- Sin datos.
- Datos parciales.
- Error recuperable.
- Permiso faltante.
- Cuenta desconectada.
- Límite de créditos.
- Éxito.
- Hover, focus, active, disabled y teclado.

## PDFs ejecutivos

El PRD y el MVP compartirán identidad con el producto:

- Portada monocromática, con negro, blanco y grises.
- Instrument Sans si el archivo está disponible localmente; fallback tipográfico controlado si no.
- Títulos en negro o grafito, con color únicamente en callouts semánticos.
- Tablas compactas con encabezados suaves.
- Callouts para decisiones, riesgos e hipótesis.
- Pie con versión, confidencialidad y número de página.

## Decisiones futuras

- Logo final y variantes.
- Sistema dark completo.
- Motion y transiciones.
- Densidad móvil y navegación responsive.
- Selector multi-workspace y roles.
