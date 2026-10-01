/**
 * Las guías que el Director puede consultar. Cada una es un `.md` de esta carpeta; acá se
 * dice cuándo sirve, que es lo único que el Director ve hasta que decide leerla.
 */
export type DirectorGuide = {
  slug: string;
  title: string;
  /** El pedido del creador que la vuelve necesaria, en una frase. */
  useWhen: string;
};

export const DIRECTOR_GUIDES: readonly DirectorGuide[] = [];
