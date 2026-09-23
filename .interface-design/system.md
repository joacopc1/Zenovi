# Zenovi - Interface Design System

Estado: dirección aprobada para discovery y MVP.

## Intención

Zenovi debe sentirse como una herramienta premium, analítica y serena: la claridad de un producto Apple aplicada a un director de marketing de contenido. La interfaz no debe competir con los Reels, Stories, métricas o recomendaciones de IA.

## Principios visuales

- Monocromático por defecto: negro, blanco y grises.
- Light-first para el MVP.
- Las cards comparten el color de la superficie que las contiene; se distinguen mediante un borde gris sutil, espacio y tipografía.
- El color se reserva para estados semánticos, visualizaciones que lo necesiten y acciones donde mejore comprensión.
- Evitar violetas, gradientes decorativos, sombras pesadas y dashboards compuestos por cajas de colores.
- Instrument Sans Variable v4 mediante Fontsource como tipografía principal, usando la misma distribución de LeadsRover. Usar Regular, Medium, SemiBold y Bold sin variantes `cv*` globales.
- Densidad media: suficiente información para trabajar sin convertir la pantalla en una tabla administrativa.

## Tokens provisionales

```css
:root {
  --canvas: #f5f5f7;
  --surface: #ffffff;
  --ink: #1d1d1f;
  --graphite: #6e6e73;
  --muted: #86868b;
  --border: rgba(0, 0, 0, 0.10);
  --border-strong: rgba(0, 0, 0, 0.16);
  --focus: #1d1d1f;
  --radius-card: 14px;
  --radius-control: 10px;
}
```

Los tokens son provisionales hasta validar wireframes y contraste. El producto debe conservar una escala de espaciado basada en 4 px.

### Calibración de bordes

- La medición en DevTools de la referencia de ElevenLabs devolvió `rgba(0, 0, 0, 0.1)` y un ancho computado de `1.11111px` sobre una clase estándar `border`. Ese ancho fraccionario se interpreta como efecto de escala/renderizado, no como un token deliberado de 1.11 px.
- Zenovi adopta `1px solid rgba(0, 0, 0, 0.10)` como borde estándar: conserva el grosor normal y eleva apenas el contraste respecto del 9 % anterior.
- ElevenLabs usa `20px` en la card inspeccionada; Zenovi conserva su radio propio de `14px` para no copiar literalmente la referencia ni volver excesivamente blandas las cards analíticas.

## Shell

- Sidebar y header pertenecen al mismo shell visual.
- Contenido principal blanco, continuo y de borde a borde; no se presenta como una tarjeta flotante dentro del shell.
- La sidebar gris y el contenido blanco se conectan mediante un único separador vertical fino, sin margen exterior, radio ni borde envolvente.
- Sidebar expandida aproximada: 220 px; colapsada: 72 px.
- Header aproximado: 56 px.
- El header global no repite el título de la pantalla; contiene únicamente navegación móvil y acciones globales. Cada vista presenta su propio título dentro del contenido.
- El nombre “Zenovi” se presenta como wordmark tipográfico arriba a la izquierda, sin isotipo, y se acompaña con un control funcional para colapsar la sidebar.
- Inmediatamente debajo del wordmark se ubica el selector compacto del perfil activo de Instagram: avatar de 24 px, `@usuario` y chevrons verticales, sin texto de estado. Comparte el gris de la sidebar tanto en reposo como en hover y se delimita únicamente con un borde fino.
- El selector prepara el modelo mental multi-marca, aunque el MVP permita una sola marca.
- Los nombres e iconos de navegación son siempre negros y de peso regular. La ruta activa se indica únicamente con un fondo gris suave: sin punto lateral, negrita ni cambio de tamaño.
- Los iconos de navegación pertenecen a Lucide, se muestran a 16 px con trazo de 1.5 px y mantienen extremos y uniones redondeados. Los controles propios del shell (marca, colapsado y upgrade) conservan sus SVG específicos. La pastilla activa mantiene su radio propio de 12 px.
- Inicio es un acceso principal independiente; Observar, Decidir, Crear y Setup se escriben con capitalización normal, a 12 px, y se agrupan de forma compacta con 10 px entre secciones.
- La navegación y sus rótulos de sección usan DM Sans a 13 px y 12 px respectivamente; el wordmark y los títulos de producto permanecen en Instrument Sans. Esto separa estructura operativa de identidad sin depender de negritas.
- Setup contiene ADN de marca y Ajustes.
- El selector de Instagram abre un menú con el perfil actual y “Añadir perfil · Próximamente”. Si Instagram todavía no devolvió el usuario, usa el nombre registrado.
- La sidebar adopta la jerarquía de la referencia Voiceon: marca y colapsado arriba, selector de Instagram antes de Inicio, navegación al centro y botón compacto de Upgrade al pie. El upgrade usa un tramado diagonal propio, más marcado a la derecha y progresivamente desvanecido hacia la izquierda; separa “Upgrade” de su estado “Próximamente”. No se muestran créditos ni porcentajes simulados.
- La navegación móvil sigue abierta: el drawer actual es provisional. Evaluar una bottom navigation/dock con las acciones esenciales antes de congelar el patrón; no trasladar automáticamente toda la sidebar de desktop.

## Jerarquía y componentes

- Brief principal entre 28 y 32 px; títulos normales de página entre 18 y 20 px; texto secundario en grafito.
- Bordes antes que sombras. Si una sombra es necesaria, debe ser corta, neutra y casi imperceptible.
- Botón primario negro con texto blanco; secundario transparente con borde.
- Estados vacíos deben explicar el siguiente paso y no ser meramente decorativos.
- Métricas deben mostrar procedencia, período y estado de sincronización.
- Las cards usan el mismo blanco que el fondo y se delimitan solo mediante un borde fino y radio de 14 px, sin sombra.
- Las cards puramente informativas no cambian de superficie al pasar el cursor. Las cards seleccionables usan `--canvas` en hover y mantienen esa misma superficie gris mientras `aria-pressed` o su estado equivalente esté activo; la selección no añade una línea decorativa ni cambia el peso tipográfico.
- El selector de perfil de Instagram es una excepción deliberada: conserva su superficie transparente en hover y comunica interacción reforzando solo el borde, según la decisión específica de la sidebar.
- Inicio es un dashboard informativo, no un brief editorial. Prioriza métricas de cuenta, evolución temporal, rendimiento de contenido y acceso a acciones; cualquier lectura de IA es secundaria y compacta.
- Las gráficas de Inicio toman como referencia el tratamiento de SaaSFrame: línea fina, área translúcida, grilla casi imperceptible, período visible y poco ruido de ejes. Usan color semántico con moderación: verde para una tendencia positiva, rojo para una negativa y negro para estados neutros o sin base comparable.
- El onboarding solo ocupa espacio en Inicio mientras existan pasos reales pendientes. Al completarse, desaparece y deja lugar al dashboard.
- El bloque principal de Analíticas integra una fila de métricas seleccionables con una única gráfica amplia debajo.
- Analíticas usa una sola gráfica amplia de 30 días controlada por Visualizaciones, Alcance e Interacciones. El estado seleccionado usa azul de datos; las comparaciones de los últimos 7 días contra los 7 anteriores usan verde, rojo o neutro según corresponda.
- `Analíticas` responde preguntas transversales sobre rendimiento de cuenta y comparación entre formatos. Puede filtrar o segmentar por Reels, Stories y Publicaciones, pero esos formatos no se convierten en destinos anidados de la sidebar.
- `Contenido` separa explícitamente `Reels`, `Publicaciones` e `Historias`; no mezcla los tres formatos en una vista genérica. Reels es la entrada predeterminada y desde cada pieza se abre su detalle o el original en Instagram.
- En la sidebar, `Contenido` funciona como grupo desplegable con accesos a `Reels`, `Posts` e `Historias`. Sólo el hijo activo mantiene el tratamiento gris de navegación; el padre conserva peso regular y los hijos se conectan con una guía vertical tenue, sin convertirse en otro panel flotante.
- Las cards de Reels respetan una proporción vertical cercana a 9:16. La media muestra duración y antigüedad como metadatos superpuestos, mientras el resumen inferior prioriza vistas, me gusta, comentarios, guardados y compartidos. Alcance e interacciones agregadas permanecen disponibles en el detalle analítico, no como lectura principal de la biblioteca.
- Vistas, me gusta, comentarios, guardados y compartidos se presentan en una única fila compacta debajo del Reel; el caption comienza inmediatamente después para evitar altura y espaciado vertical innecesarios.
- El detalle de una pieza usa una composición asimétrica: Reel de hasta 280 px a la izquierda y lectura, rendimiento, reproducción y análisis a la derecha. El CTA a Instagram vive en el pie de la vista previa, nunca flotando sobre el contenido.
- El bloque superior del detalle termina con la vista previa y sus datos inmediatos. Análisis y módulos posteriores salen de la columna derecha y recuperan todo el ancho, evitando un vacío vertical debajo de Reels, carruseles o Historias.
- Las métricas de una pieza son cards independientes en una grilla, sin otra card contenedora ni un encabezado redundante de “Rendimiento”.
- En el detalle de una pieza, visualizaciones, alcance, engagement y la futura atribución de ventas se presentan como KPI independientes; ventas permanece explícitamente en “Próximamente” hasta existir una integración real. Me gusta, comentarios, guardados y compartidos se agrupan en una única visualización comparativa; duración, tiempo visto, retención y omisión forman un segundo bloque de reproducción. No convertir cada dato disponible en una card.
- La vista previa vertical del detalle usa 270 px en escritorio para conservar presencia sin dominar el contexto analítico derecho. La métrica se llama “Tiempo visto total” para distinguirla de la duración y del tiempo medio por persona sin agregar otra línea explicativa a la card; su rótulo nunca se parte en dos líneas.
- El caption del detalle muestra dos líneas de contexto —incluido el CTA cuando forme parte del texto— y ofrece “Ver más” cuando supera ese resumen. Al expandirse recupera su altura natural, sin scroll interno ni un alto máximo artificial.
- Los títulos de módulos y métricas del contenido usan negro, 13–15 px e iconos negros. El gris queda para explicaciones, períodos y procedencia, no para los conceptos principales.
- La comparación contra benchmarks se representa dentro de un único módulo con barras para “Esta pieza” y “Mediana”, evitando otra grilla de mini-cards idénticas.
- Cuando existan snapshots diarios, la evolución de una pieza se mostrará como línea o área desde su publicación, destacando el pico y la caída natural de visibilidad. No usar un radar por día de la semana ni inferir una serie a partir del acumulado actual.
- La evolución por pieza representa visualizaciones nuevas de cada día, derivadas sólo entre snapshots acumulados consecutivos. El primer día, los huecos y cualquier retroceso quedan sin dato: no se atribuye a una fecha una diferencia que puede pertenecer a varias.
- En el detalle, los Reels se reproducen con controles nativos y una URL de CDN pedida a Meta en ese momento; la URL persistida queda sólo como respaldo porque Meta la rota.
- Engagement se expresa como interacciones sobre visualizaciones. Retención media se calcula como tiempo medio de visualización sobre duración real del Reel. Ambos muestran ausencia en vez de convertir datos faltantes en cero.
- Un benchmark requiere al menos tres piezas comparables del mismo formato y usa la mediana. La evolución o distribución diaria de views de una pieza requiere snapshots históricos; no se dibuja a partir de un acumulado lifetime.
- El rendimiento relativo se expresa con una insignia compacta de fondo transparente y borde fino: triángulo ascendente y verde cuando supera la referencia, descendente y rojo cuando queda por debajo, lateral y neutro cuando está en línea. Sobre una miniatura adopta el mismo vidrio oscuro que la duración, con texto, borde y triángulo blancos para conservar contraste. El valor mantiene el formato de multiplicador (`×N`) porque compara contra la mediana; no se transforma en un porcentaje ficticio.
- Evitar un submenú desplegable bajo Analíticas en el MVP: duplicaría formatos, aumentaría la navegación y confundiría una vista de rendimiento con una biblioteca de contenido.
- La versión actual de Analíticas es un primer corte funcional, no una arquitectura cerrada. Antes de sumar cards se debe comprobar la procedencia y consistencia de cada estadística y definir qué preguntas reales necesita responder el usuario.
- El nombre de navegación `Analíticas` continúa provisional. Debe validarse contra el modelo mental del ICP y la amplitud futura de la vista; la ausencia de ese nombre en Moka no es, por sí sola, razón para cambiarlo.
- `Competidores` queda fuera de la navegación del MVP inicial. Puede entrar en beta extendida detrás de un flag únicamente después de validar fuente de datos, términos, estabilidad y costo.
- Estados de conexión Meta: no conectado, conectando, conectado, parcial, requiere acción, expirado y error.

## Dark mode

Es deseable para el producto, pero no bloquea el MVP. Solo se publica cuando todas las pantallas, gráficos, estados semánticos y contrastes estén revisados; no se obtiene invirtiendo colores automáticamente.

## Referencias aprobadas

- La referencia estructural es el shell de Glovi: header y sidebar conectados, contenido limpio y tarjetas delimitadas por borde. Se toma el principio, no se copia la identidad visual ni componentes literalmente.
- La navegación de LeadsRover define el tratamiento activo: texto e icono negros constantes y una única pastilla gris de selección, sin indicadores adicionales.
- La sidebar de Voiceon define la futura jerarquía vertical: producto arriba, navegación al centro, perfil activo y upgrade abajo.
- El dashboard compartido de SaaSFrame define la referencia para cards analíticas, gráficas de área compactas y tablas de rendimiento. Se toma el lenguaje de visualización, no su color de marca.

## Implementación en Next.js

- Usar Next.js App Router, React, TypeScript y Tailwind CSS 4 con configuración CSS-first mediante `@theme`.
- `globals.css` contiene tokens, reset/base, accesibilidad y utilidades verdaderamente globales; no corrige componentes mediante selectores de clases hardcodeadas ni cadenas de `!important`.
- Light es el tema base del MVP. No implementar dark mediante una matriz de overrides hasta diseñar y validar ese modo.
- Cada valor visual reutilizado debe provenir de un token semántico. Evitar colores arbitrarios repetidos dentro de `className`.
- Dividir el shell en `AppShell`, `Sidebar`, `SidebarNav`, `WorkspaceSwitcher`, `ConnectionStatus`, `UsageMeter`, `UserMenu` y `AppHeader`.
- La sidebar recibe datos serializables y estado de ruta; no consulta Supabase, no contiene lógica de facturación y no implementa modales ajenos a navegación.
- Mantener la obtención de sesión y workspace en el layout de servidor, pero mover cada consulta de dominio a su servicio correspondiente.
- Usar una sola familia de iconos instalada o SVG locales. No cargar iconos esenciales desde hojas CSS externas en runtime.
- Los estados visuales se expresan con variantes de componente y tokens semánticos, no con reglas globales que inspeccionen clases internas.

### Lecciones tomadas de Glovi

- Conservar: Instrument Sans Variable v4 autohospedada, App Router, Tailwind 4, shell servidor + componentes cliente puntuales, sidebar de 220/72 px y hoja principal continua.
- No copiar: `globals.css` extenso con overrides de colores hardcodeados, modo claro construido encima de dark, dependencias de iconos por CDN y una sidebar monolítica con navegación, tema, feedback, consumo y perfil.
