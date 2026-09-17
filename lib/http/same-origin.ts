import type { NextRequest } from "next/server";

/**
 * Si un pedido que cambia datos viene del propio sitio.
 *
 * Un formulario en otro dominio puede hacer POST a Zenovi con la sesión de la persona;
 * el encabezado `Origin` lo delata. Sin encabezado se acepta: los navegadores lo mandan
 * en todo POST entre orígenes, así que su ausencia no es un pedido cruzado.
 */
export function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}
