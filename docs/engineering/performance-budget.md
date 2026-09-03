# Zenovi — Presupuesto de rendimiento

Actualizado: 2026-09-03  
Estado: obligatorio desde el primer shell

## Objetivo

Evitar que navegación, bloques de analítica y contenido aparezcan tarde o en cascada. Lighthouse es un control de laboratorio; se complementará con métricas reales de usuarios cuando exista tráfico.

## Umbrales del MVP

Medidos sobre build de producción o Preview de Vercel, nunca sobre `next dev`:

| Señal | Objetivo | Gate de lanzamiento |
|---|---:|---:|
| Lighthouse Performance móvil | ≥ 85 | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 | ≥ 95 |
| Lighthouse Best Practices | ≥ 95 | ≥ 95 |
| LCP | ≤ 2,5 s | ≤ 2,5 s |
| CLS | ≤ 0,10 | ≤ 0,10 |
| Total Blocking Time | ≤ 200 ms | ≤ 200 ms |
| First Contentful Paint | ≤ 1,8 s | ≤ 1,8 s |

Una regresión mayor a 5 puntos de Performance o que atraviese un límite de Core Web Vitals bloquea el merge hasta explicar y corregir la causa.

## Reglas de arquitectura

- Server Components por defecto; agregar `"use client"` solo al límite interactivo mínimo.
- No bloquear todo el layout esperando métricas, consumo, notificaciones o integraciones independientes.
- Iniciar consultas independientes en paralelo y usar límites de `Suspense` para bloques que puedan llegar después.
- Sesión y workspace pueden bloquear la ruta protegida; métricas secundarias no.
- Fuente e iconos locales; sin hojas CSS esenciales cargadas desde CDNs en runtime.
- Reservar dimensiones de imágenes, videos, skeletons y gráficos para evitar CLS.
- Cargar editores, gráficos pesados, reproductores y chat avanzado únicamente al abrirlos.
- Mantener pequeño el estado enviado a Client Components; no serializar respuestas completas de Supabase.
- Las rutas largas de contenido deben usar paginación y `content-visibility` cuando corresponda.

## Cadencia

1. `typecheck`, `lint` y `build` en cada cambio estructural.
2. Lighthouse manual en Chrome al cerrar cada pantalla importante.
3. Lighthouse automatizado en pull requests cuando exista una Preview estable de Vercel.
4. Métricas de campo y alertas cuando la beta tenga usuarios reales.

## Protocolo manual

1. Ejecutar un build de producción.
2. Abrir la ruta en una ventana incógnita, sin extensiones.
3. DevTools → Lighthouse → Mobile → Performance, Accessibility y Best Practices.
4. Ejecutar tres veces y conservar la mediana.
5. Registrar puntajes, LCP, CLS, TBT y la causa de cualquier regresión.

Las recomendaciones automáticas son evidencia para investigar, no cambios que deban aplicarse ciegamente.
