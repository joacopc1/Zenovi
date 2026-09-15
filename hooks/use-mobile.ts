import { useSyncExternalStore } from 'react'

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Intent UI — use-mobile, reescrito sobre `useSyncExternalStore`.
 *
 * El original leía el ancho con un `setState` dentro de un efecto, lo que fuerza un
 * render extra en cada montaje. Suscribirse a la media query evita ese render y
 * devuelve `false` en el servidor, igual que antes.
 */
export function useIsMobile() {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(QUERY)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
