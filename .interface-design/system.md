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
  --border: rgba(0, 0, 0, 0.09);
  --border-strong: rgba(0, 0, 0, 0.16);
  --focus: #1d1d1f;
  --radius-card: 14px;
  --radius-control: 10px;
}
```

Los tokens son provisionales hasta validar wireframes y contraste. El producto debe conservar una escala de espaciado basada en 4 px.

## Shell

- Sidebar y header pertenecen al mismo shell visual.
- Contenido principal blanco, continuo y de borde a borde; no se presenta como una tarjeta flotante dentro del shell.
- La sidebar gris y el contenido blanco se conectan mediante un único separador vertical fino, sin margen exterior, radio ni borde envolvente.
- Sidebar expandida aproximada: 220 px; colapsada: 72 px.
- Header aproximado: 56 px.
- Selector de workspace/marca arriba a la izquierda, con nombre, avatar o logo y chevrons verticales.
- Perfil del usuario separado del workspace y ubicado al final de la navegación.
- El selector prepara el modelo mental multi-marca, aunque el MVP permita una sola marca.
- Los nombres e iconos de navegación son siempre negros y de peso regular. La ruta activa se indica únicamente con un fondo gris suave: sin punto lateral, negrita ni cambio de tamaño.
- Los iconos de navegación son SVG lineales de 1.75 px, con extremos y uniones redondeados. La pastilla activa usa radio de 12 px.
- Inicio es un acceso principal independiente; Observar, Decidir, Crear y Setup se escriben con capitalización normal, a 12 px, y se agrupan debajo con 12 px entre secciones.
- Setup contiene ADN de marca y Ajustes. El encabezado de la sidebar representa la marca personal activa con nombre de perfil, usuario y avatar real de Instagram; usa iniciales como fallback.
- La identidad superior abre un selector con el perfil actual y “Añadir perfil · Próximamente”. El perfil del propietario y la acción Salir permanecen al pie, debajo de Instagram y Créditos.
- La navegación móvil sigue abierta: el drawer actual es provisional. Evaluar una bottom navigation/dock con las acciones esenciales antes de congelar el patrón; no trasladar automáticamente toda la sidebar de desktop.

## Jerarquía y componentes

- Brief principal entre 28 y 32 px; títulos normales de página entre 18 y 20 px; texto secundario en grafito.
- Bordes antes que sombras. Si una sombra es necesaria, debe ser corta, neutra y casi imperceptible.
- Botón primario negro con texto blanco; secundario transparente con borde.
- Estados vacíos deben explicar el siguiente paso y no ser meramente decorativos.
- Métricas deben mostrar procedencia, período y estado de sincronización.
- Las cards usan el mismo blanco que el fondo y se delimitan solo mediante un borde fino y radio de 14 px, sin sombra.
- El bloque principal de Analíticas integra una fila de métricas seleccionables con una única gráfica amplia debajo.
- Estados de conexión Meta: no conectado, conectando, conectado, parcial, requiere acción, expirado y error.

## Dark mode

Es deseable para el producto, pero no bloquea el MVP. Solo se publica cuando todas las pantallas, gráficos, estados semánticos y contrastes estén revisados; no se obtiene invirtiendo colores automáticamente.

## Referencias aprobadas

- La referencia estructural es el shell de Glovi: header y sidebar conectados, contenido limpio y tarjetas delimitadas por borde. Se toma el principio, no se copia la identidad visual ni componentes literalmente.
- La navegación de LeadsRover define el tratamiento activo: texto e icono negros constantes y una única pastilla gris de selección, sin indicadores adicionales.

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
