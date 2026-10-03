/**
 * Señales de que alguien intenta manipular al Director: pedirle que ignore sus pautas, que
 * las muestre, hacerse pasar por el equipo o esconder el pedido en otra forma de escribir.
 * No bloquea (hay frases legítimas que se parecen): sirve para enterarse y mirar de cerca.
 */
export type InjectionSignal = "override" | "extraction" | "impersonation" | "obfuscation";

const normalize = (text: string) =>
  text.toLocaleLowerCase("es").normalize("NFD").replace(/[̀-ͯ]/g, "");

const PATTERNS: Record<Exclude<InjectionSignal, "obfuscation">, RegExp[]> = {
  override: [
    /\b(ignora|olvida|olvidate|saltea|desactiva)\w* (todas? )?(las |tus )?(instrucciones|pautas|reglas|restricciones)/,
    /\bignore (all |any )?(previous|prior|above|your) (instructions|rules)/,
    /\b(a partir de ahora|from now on) (sos|eres|you are)\b/,
    /\b(modo desarrollador|developer mode|jailbreak|\bdan\b|sin (reglas|restricciones|filtros))/,
  ],
  extraction: [
    /\b(system prompt|prompt del sistema|mensaje del sistema)/,
    /\b(mostra|muestr|deci|repeti|copia|imprimi|revela|traduci|pasa|dame|comparti|escribi)\w* (todas )?(tus|las) (instrucciones|pautas|reglas|indicaciones|configuracion)/,
    /\b(que|cuales) (son )?(tus|las) (instrucciones|pautas) (exactas|completas|originales)/,
  ],
  impersonation: [
    /\bsoy (del|parte del) equipo (de zenovi)?/,
    /\b(soy|habla) (el |un )?(desarrollador|admin|administrador|programador|ceo|fundador) de zenovi/,
    /\bsoy (de|del equipo de) anthropic/,
    /\b(mensaje|aviso|orden) (del sistema|oficial de zenovi)/,
  ],
};

export function detectInjectionSignals(text: string): InjectionSignal[] {
  const plain = normalize(text);
  const found = new Set<InjectionSignal>();
  for (const [signal, patterns] of Object.entries(PATTERNS) as Array<[InjectionSignal, RegExp[]]>) {
    if (patterns.some((pattern) => pattern.test(plain))) found.add(signal);
  }
  if (looksObfuscated(text)) found.add("obfuscation");
  return [...found];
}

/** Base64 largo, o un mensaje que es casi todo números romanos o letras sueltas. */
function looksObfuscated(text: string) {
  if (/[A-Za-z0-9+/]{60,}={0,2}/.test(text.replace(/\s/g, ""))) return true;
  const tokens = text.trim().split(/[\s,.;:-]+/).filter(Boolean);
  if (tokens.length < 6) return false;
  const roman = tokens.filter((token) => /^[IVXLCDM]+$/.test(token)).length;
  const singleLetters = tokens.filter((token) => /^\p{L}$/u.test(token)).length;
  return roman / tokens.length >= 0.6 || singleLetters / tokens.length >= 0.7;
}

/**
 * Cuántos intentos se toleran en un mismo chat. El modelo puede ceder ante la insistencia;
 * este tope no: al llegar, el chat se cierra y el Director deja de recibir mensajes ahí.
 */
export const MAX_INJECTION_ATTEMPTS_PER_CHAT = 3;

export function countInjectionAttempts(userTexts: readonly string[]) {
  return userTexts.filter((text) => detectInjectionSignals(text).length > 0).length;
}
