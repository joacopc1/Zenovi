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
- Instrument Sans Variable como tipografía principal. Usar Regular, Medium, SemiBold y Bold.
- Densidad media: suficiente información para trabajar sin convertir la pantalla en una tabla administrativa.

## Tokens provisionales

```css
:root {
  --canvas: #f1f0ed;
  --surface: #fffefc;
  --ink: #111113;
  --graphite: #5e5e66;
  --muted: #8a8a91;
  --border: #e8e7e3;
  --border-strong: #d2d1cc;
  --focus: #111113;
  --radius-card: 14px;
  --radius-control: 10px;
}
```

Los tokens son provisionales hasta validar wireframes y contraste. El producto debe conservar una escala de espaciado basada en 4 px.

## Shell

- Sidebar y header pertenecen al mismo shell visual.
- Contenido principal como superficie continua, con una transición curva sutil respecto del shell.
- Sidebar expandida aproximada: 220 px; colapsada: 72 px.
- Header aproximado: 56 px.
- Selector de workspace/marca arriba a la izquierda, con nombre, avatar o logo y chevrons verticales.
- Perfil del usuario separado del workspace y ubicado al final de la navegación.
- El selector prepara el modelo mental multi-marca, aunque el MVP permita una sola marca.

## Jerarquía y componentes

- Títulos directos y grandes; texto secundario en grafito.
- Bordes antes que sombras. Si una sombra es necesaria, debe ser corta, neutra y casi imperceptible.
- Botón primario negro con texto blanco; secundario transparente con borde.
- Estados vacíos deben explicar el siguiente paso y no ser meramente decorativos.
- Métricas deben mostrar procedencia, período y estado de sincronización.
- Estados de conexión Meta: no conectado, conectando, conectado, parcial, requiere acción, expirado y error.

## Dark mode

Es deseable para el producto, pero no bloquea el MVP. Solo se publica cuando todas las pantallas, gráficos, estados semánticos y contrastes estén revisados; no se obtiene invirtiendo colores automáticamente.

## Referencia aprobada

La referencia estructural es el shell de Glovi: header y sidebar conectados, contenido limpio y tarjetas delimitadas por borde. Se toma el principio, no se copia la identidad visual ni componentes literalmente.

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

- Conservar: Instrument Sans con `next/font`, App Router, Tailwind 4, shell servidor + componentes cliente puntuales, sidebar de 220/72 px y hoja principal continua.
- No copiar: `globals.css` extenso con overrides de colores hardcodeados, modo claro construido encima de dark, dependencias de iconos por CDN y una sidebar monolítica con navegación, tema, feedback, consumo y perfil.
