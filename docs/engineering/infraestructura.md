# Zenovi — Cómo está armado esto

Actualizado: 2026-09-26

Este documento existe para que cualquiera —o cualquier agente que arranque sin contexto—
pueda ubicarse sin leer el código entero ni volver a descubrir por las malas las cosas que
ya costaron una vez. No describe funcionalidades: eso está en `docs/ROADMAP.md`. Acá va
**dónde vive cada cosa, qué reglas rigen y qué trampas ya conocemos**.

## El stack, en una línea cada uno

- **Next.js 16 con App Router y Turbopack.** Todo renderiza en el servidor salvo lo que
  necesita estado; los componentes de cliente llevan `"use client"` y se mantienen chicos.
- **React 19.** Se usan `useOptimistic` para el arrastre del tablero y `cache()` para que
  el contexto de cuenta no se consulte dos veces por render.
- **TypeScript estricto.** Sin `any`, sin `!` y sin castear para tapar un tipo que no
  cierra: si un borde no está claro, se hace explícito.
- **Tailwind v4** con tokens propios en `app/globals.css` (`@theme`). No hay colores
  sueltos en los componentes: se usan `ink`, `graphite`, `muted`, `mist`, `paper`,
  `canvas`, `success`, `danger`, `warning`, `data`.
- **Supabase** (Postgres + Auth + RLS) como única base.
- **Vercel** para desplegar.

## Las capas, y qué puede hacer cada una

| Carpeta | Qué vive ahí | Qué NO puede hacer |
|---|---|---|
| `lib/<dominio>/` | Lógica pura: reglas, cálculos, formatos. Se prueba con `node --test`. | Tocar la base, leer `window`, importar React. |
| `lib/data/` | Lectura de datos. Todo archivo abre con `import "server-only"`. | Contener reglas de negocio; eso sube a `lib/<dominio>/`. |
| `app/**/actions.ts` | Escrituras (`"use server"`). Validan la entrada y revalidan la ruta. | Decidir reglas de dominio por su cuenta. |
| `app/**/page.tsx` | Trae los datos y los reparte. | Calcular derivaciones; para eso hay modelos como `lib/production/board.ts`. |
| `components/` | Dibujar. | Derivar estado que pueda vivir en `lib/`. |

La regla que ordena todo: **si se puede probar sin React y sin base, va en `lib/`.**

## Supabase: lo que hay que saber antes de tocar nada

- **Las migraciones las corre Joaco a mano** en el SQL Editor. El código no puede aplicar
  DDL. Por lo tanto: **el SQL se corre *antes* de desplegar el código que lo necesita**, y
  cuando se escribe una migración hay que avisarle explícitamente, porque hasta que la
  corra la sección afectada tira error 500 (`42703 column ... does not exist`).
- **RLS está activo en todas las tablas** y se apoya en `memberships`. Un usuario ve lo de
  su workspace y nada más.
- **La clave de servicio ve todo y saltea RLS.** Sirve para sondas y scripts, **nunca**
  para verificar que algo "funciona": una verificación hecha con la clave de servicio
  puede mezclar datos de varios workspaces y dar un resultado que en la app no se da. Para
  comprobar de verdad hay que abrir sesión de usuario (`generateLink` + `verifyOtp`).
- **Las claves foráneas se validan por fuera de RLS.** Escribir un id ajeno en una columna
  con FK no falla por RLS: la comprobación corre como dueño de la tabla. Toda acción que
  guarde un id que vino del cliente tiene que **leerlo antes con la sesión del usuario**
  para confirmar que lo ve.
- **PostgREST devuelve las relaciones incrustadas como objeto o como arreglo** según la
  cardinalidad que infiera. Por eso existe `lib/data/embedded-row.ts`: usarlo siempre.
- **`neq` no es "distinto de" cuando hay NULL.** `col=neq.X` descarta también las filas con
  `col` en NULL, porque en SQL `NULL <> 'X'` no es verdadero. Si NULL es un caso válido,
  hay que escribir `.or("col.is.null,col.neq.X")`.
- Las consultas devuelven **1000 filas como máximo** por defecto. Si una lectura puede
  superarlo, hay que paginar o acotar por fecha.

## Instagram

- Zenovi usa **Instagram Login** contra `graph.instagram.com` (app `Zenovi-IG`, distinta de
  la app de Meta: **son secretos distintos**, confundirlos rompe el borrado de datos).
- Es una superficie **reducida**: no soporta introspección (`metadata=1` devuelve cero
  campos) y no expone los Trial Reels. El camino de Facebook Login es más rico y está sin
  probar; ver `docs/ROADMAP.md`.
- Cada cuenta tiene **dos ids**: `id` (de la app) y `user_id` (de la cuenta profesional).
  Meta avisa el borrado de datos con el segundo, por eso se guarda
  `social_accounts.professional_account_id`.
- Los tokens se guardan **cifrados** (AES-256-GCM, `META_TOKEN_ENCRYPTION_KEY`) y se
  renuevan cuando faltan 20 días o menos.
- Un acceso revocado llega como `OAuthException` código 190; se traduce a
  `authorization_revoked` y la conexión pasa a `action_required`.

## Tests

- Se corren con `npm test` → `node --experimental-strip-types --test tests/*.test.mjs`.
- **Sólo se prueban módulos puros de `lib/`.** No hay tests de componentes.
- El runner de Node **no resuelve el alias `@/`**. Un módulo que quiera ser testeable
  importa con ruta relativa y extensión (`./calendar.ts`), que funciona gracias a
  `allowImportingTsExtensions` en `tsconfig.json`. Los `import type` sí pueden usar `@/`
  porque se borran al ejecutar.
- La fecha y la hora **se pasan como parámetro** (`now: Date`), nunca se leen adentro de la
  función: si no, el test depende del día en que se corre.

## Comprobar contra datos reales

Los tests prueban lo que uno imaginó. Para lo que importa —que la lógica funcione con los
datos que hay— se escribe un script en el directorio de scratch, se corre con
`node --env-file=.env.local`, y se borra. Dos reglas que ya costaron caro:

1. **Abrir sesión de usuario**, no usar la clave de servicio (ver arriba).
2. **Limpiar lo que se crea**, en un `finally`.

Las sondas de sólo lectura que conviene conservar viven en `scripts/` con su comando en
`package.json` (`probe:demographics`, `probe:media`, `probe:trial`).

## Antes de dar algo por terminado

```
npm run lint && npm run typecheck && npm test && npm run build
```

Y para cambios que valen la pena revisar de verdad, la skill
`.agents/skills/thermo-nuclear-code-quality-review` — que **no** aparece en la lista de
skills de Claude Code, hay que leerla del disco.

## Trampas que ya nos costaron una vez

- `sr-only` sobre una `<table>` estira la página entera; hay que envolverla en un `<div>`.
- `Number(null)` es `0` y pasa `Number.isInteger`, `>= 0` y `< n`. Leer de `localStorage`
  exige comprobar `null` aparte.
- Un `setInterval` para animar avanza al doble en una pantalla de 120Hz: usar
  `requestAnimationFrame` con el tiempo transcurrido.
- `new Date("5/9/2026")` es válido en JavaScript y significa 9 de mayo. Las fechas que
  vienen del cliente se validan con forma `YYYY-MM-DD` **y** comprobando que existan.
- dnd-kit elige el destino por proporción de superposición: si las tarjetas también son
  destino, gana la tarjeta y no la columna.
- `zsh` usa `$path` como alias de `$PATH`: nunca llamar `path` a una variable de bucle.
- El locale `es-UY` escribe "setiembre" y abrevia "23 set.". No es un error.
