# Zenovi — Arquitectura de navegación y shell

Actualizado: 2026-09-10
Estado: decisión de diseño para wireframes del MVP

## 1. Intención

La persona abre Zenovi entre publicaciones, sesiones con clientes y tareas comerciales. La interfaz debe ayudarla a responder rápidamente tres preguntas:

1. ¿Qué señal importa ahora?
2. ¿Qué significa para mi estrategia?
3. ¿Qué hago o creo después?

El shell representa un ciclo de trabajo de marketing, no una colección de herramientas ni una réplica de Instagram. Debe sentirse sereno, continuo y preciso, con datos legibles y acceso claro a la siguiente decisión.

## 2. Territorio visual

### Dominio

- Señal frente a ruido.
- Panel de rendimiento.
- Rendimiento de contenido.
- Banco de ideas y guiones.
- Calendario de publicación.
- Evidencia y decisión.

### Mundo cromático

- Papel cálido para el área de trabajo.
- Tinta negra para decisiones y acciones.
- Grafito para contexto secundario.
- Niebla gris para separaciones.
- Verde únicamente para resultados confirmados.
- Ámbar únicamente para atención o datos incompletos.

### Defaults rechazados

- Brief editorial dominante en Inicio → dashboard informativo con métricas, evolución, rendimiento de contenido y acciones; la IA queda como apoyo secundario.
- Sidebar organizada por tecnología → navegación organizada por el ciclo de trabajo.
- Reels, Stories y publicaciones como módulos aislados → una biblioteca de Contenido con filtros por formato.
- Botón flotante de chatbot → Director como destino principal y como acción contextual dentro de cada objeto.

## 3. Arquitectura de información

### Observar

- **Inicio**: resumen de cuenta, métricas, evolución, contenido destacado, onboarding pendiente y accesos rápidos.
- **Analíticas**: evolución general, comparaciones y señales de la cuenta.
- **Contenido**: biblioteca única con tabs `Todo`, `Reels`, `Stories` y `Publicaciones`.

### Decidir

- **Director**: conversaciones estratégicas, historial y consultas con contexto.

### Crear y planificar

- **Baúl**: ideas, hooks, guiones y piezas en proceso.
- **Calendario**: planificación temporal del mismo contenido del Baúl.

### Marca

- **ADN de marca**: oferta, audiencia, voz, objetivos y contexto confirmado.

### Sistema

- **Integraciones**: Instagram, estado de sincronización y desconexión.
- **Créditos y plan**: saldo, consumo y límites.
- **Ajustes**: perfil personal, workspace, privacidad y eliminación.

`Competidores` no aparece en la navegación del MVP hasta cerrar su viabilidad. Meta Ads, DMs y publicación automática tampoco aparecen como opciones bloqueadas.

## 4. Sidebar de escritorio

Ancho expandido: `224 px`.  
Ancho colapsado futuro: `72 px`.  
Header global: `56 px`.  
Base de espaciado: `4 px`.

```text
┌────────────────────────┬─────────────────────────────────────────────┐
│  Zenovi             ◫  │                   Director  Avisos  Perfil   │
│  ◉  @perfil        ⇅  ├─────────────────────────────────────────────┤
│  Inicio                │                                             │
│  Observar              │                                             │
│     Analíticas         │              Área de trabajo                │
│     Contenido          │                                             │
│  │                     │                                             │
│  Decidir               │                                             │
│     Director           │                                             │
│  │                     │                                             │
│  Crear                 │                                             │
│     Baúl               │                                             │
│     Calendario         │                                             │
│                        │                                             │
│  Setup                 │                                             │
│     ADN de marca       │                                             │
│     Ajustes            │                                             │
│                        │                                             │
│  ⚡ Upgrade   Próxim.  │                                             │
└────────────────────────┴─────────────────────────────────────────────┘
```

### Comportamiento

- “Zenovi” funciona como wordmark tipográfico y el control contiguo colapsa la sidebar.
- El selector inmediatamente inferior representa el perfil activo de Instagram y muestra su foto cuando Meta la entrega; usa iniciales cuando no existe imagen.
- Los rótulos `Observar`, `Decidir` y `Crear` enseñan el modelo mental; no son desplegables.
- El destino activo conserva texto e icono negros de peso regular y se distingue solo con un fondo gris de radio suave; no usa punto lateral.
- `Contenido` conserva filtros y orden al navegar al detalle y volver.
- `Director` acepta entrada contextual desde cualquier Reel, Story, idea o periodo sin crear otra sección en la sidebar.
- `ADN de marca` y `Ajustes` viven bajo `Setup` porque cambian contexto o configuración, no producción diaria.
- El selector de Instagram abre el perfil actual y una opción futura `Añadir perfil · Próximamente`; múltiples perfiles siguen fuera del MVP.
- El pie contiene un acceso compacto a Upgrade. No muestra porcentajes ni créditos inventados.
- El perfil personal de Google se muestra en el extremo derecho del header y abre su menú; permanece separado del perfil de Instagram.

## 5. Header

El header no duplica el título de la vista. Contiene únicamente:

- Breadcrumb cuando existe profundidad: `Contenido / Reel`.
- Acción global `Director IA`.
- Notificaciones.
- Avatar del perfil personal autenticado con Google y menú desplegable.
- Acciones contextuales solo cuando sean realmente globales para la pantalla.

No hay buscador global en el MVP. La búsqueda aparece dentro de Contenido, Director o Baúl cuando el volumen lo justifique.

## 6. Rutas del MVP

| Destino | Ruta propuesta | Contenido principal |
|---|---|---|
| Inicio | `/app` | Brief y próxima acción |
| Analíticas | `/app/analytics` | Cuenta y periodos |
| Contenido | `/app/content` | Todos los formatos |
| Detalle | `/app/content/:mediaId` | Métricas, análisis y evidencia |
| Director | `/app/director` | Historial y conversación |
| Conversación | `/app/director/:threadId` | Chat persistente |
| Baúl | `/app/vault` | Ideas y guiones |
| Calendario | `/app/calendar` | Planificación |
| ADN | `/app/brand` | Contexto de marca |
| Integraciones | `/app/settings/integrations` | Instagram y sincronización |
| Créditos | `/app/settings/usage` | Saldo y consumo |
| Ajustes | `/app/settings` | Perfil, workspace y privacidad |

## 7. Responsive

En móvil no se encoge la sidebar. Se reemplaza por:

- Header de `52 px` con marca, título corto y acción contextual.
- Barra inferior con `Inicio`, `Contenido`, `Director` y `Baúl`.
- `Más` abre una hoja con Analíticas, Calendario, ADN, Integraciones, créditos y ajustes.
- Al entrar a un objeto, la barra inferior puede ocultarse durante lectura o edición profunda y reaparecer al volver.

La prioridad móvil es consultar, decidir y capturar una idea. El análisis denso y la planificación completa siguen siendo desktop-first.

## 8. Estados obligatorios del shell

- **No conectado**: el estado de Instagram conduce al preflight; Contenido y Analíticas muestran explicación contextual.
- **Sincronizando**: progreso accesible desde el estado inferior sin bloquear Director, ADN o Baúl.
- **Parcial**: la pantalla conserva datos útiles y señala exactamente qué falta.
- **Requiere acción**: estado ámbar con CTA de reconexión.
- **Error**: mensaje accionable; nunca solo un punto rojo.
- **Sin créditos**: el historial permanece accesible; se bloquean únicamente acciones costosas.
- **Sidebar colapsada**: tooltips, foco visible y nombres accesibles; no forma parte del primer corte del MVP.

## 9. Decisiones de detalle

- Instrument Sans para toda la interfaz; cifras tabulares para métricas.
- Profundidad por bordes y cambios suaves de superficie. Sombras solo en menús, popovers y modales.
- El shell usa `--zen-canvas`; el área de trabajo usa `--zen-paper`.
- Iconos lineales de una sola familia y únicamente donde aceleran reconocimiento.
- Movimiento breve y desacelerado; sin rebotes.
- Todas las métricas indican fuente, periodo y última sincronización.

## 10. Siguiente wireframe

El shell y el primer corte de Inicio ya existen. La siguiente validación visual prioriza **Analíticas**, comprobando antes la procedencia de las métricas; después siguen Contenido y el detalle de Reel. Inicio se perfeccionará al final con el aprendizaje de las demás secciones.
