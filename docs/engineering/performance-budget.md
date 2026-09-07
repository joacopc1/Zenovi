# Zenovi — Presupuesto de rendimiento

Actualizado: 2026-09-07
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
3. Lighthouse CLI local al cerrar un flujo completo o antes de subir un cambio importante.
4. Métricas de campo y alertas cuando la beta tenga usuarios reales.

## Protocolo manual

1. Ejecutar `npm run build` y luego `npm run start`.
2. En otra terminal, ejecutar Lighthouse sin instalarlo dentro del proyecto: `npx --yes lighthouse@latest http://localhost:3000 --view`.
3. Para escritorio, añadir `--preset=desktop`; sin ese parámetro Lighthouse utiliza su emulación móvil.
4. Ejecutar tres veces y conservar la mediana.
5. Registrar puntajes, LCP, CLS, TBT y la causa de cualquier regresión.

También se puede usar DevTools → Lighthouse. El CLI resulta más reproducible y puede vivir en la caché de `npx` sin agregarse a `package.json` ni al lockfile de Zenovi.

Las recomendaciones automáticas son evidencia para investigar, no cambios que deban aplicarse ciegamente.

## Línea base del app shell

Mediana de tres corridas móviles sobre la build de producción local del 2026-09-07:

| Señal | Resultado |
|---|---:|
| Lighthouse Performance | 96 |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices | 100 |
| Lighthouse SEO | 100 |
| FCP | 0,82 s |
| LCP | 2,05 s |
| TBT | 211 ms |
| CLS | 0 |

El TBT supera por 11 ms el objetivo interno. Se mantiene como observación para las próximas pantallas y deberá volver a medirse al incorporar datos, gráficos e interacciones reales.
