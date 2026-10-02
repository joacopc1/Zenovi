/**
 * La última cuenta de Instagram que usó este navegador, para saludar en el login con su
 * usuario ("continuar con @elcostarrica"). Es un dato público y no abre nada: iniciar sesión
 * sigue pidiendo correo y contraseña.
 */
export const LAST_ACCOUNT_COOKIE = "zenovi_last_account";
export const LAST_ACCOUNT_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

const INSTAGRAM_USERNAME = /^[a-z0-9._]{1,30}$/i;

/** Sólo un usuario de Instagram válido: lo que venga en la cookie no llega a la pantalla de otra forma. */
export function readLastAccount(value: string | undefined) {
  const username = value?.replace(/^@/, "");
  return username && INSTAGRAM_USERNAME.test(username) ? username : null;
}
