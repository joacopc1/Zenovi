/** Limpia el caption sólo para presentarlo; el original sigue guardado para búsqueda y datos. */
export function cleanDisplayCaption(caption: string | null) {
  if (!caption?.trim()) return "";

  return caption
    .split(/\n+/)
    .map((line) =>
      line
        .replace(/(^|\s)#[^\s#]+/gu, "$1")
        .replace(/\s{2,}/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join("\n");
}

export function splitDisplayCaption(caption: string | null, formatLabel: string) {
  const text = cleanDisplayCaption(caption);

  if (!text) {
    return { title: formatLabel, description: "Sin descripción." };
  }

  const paragraphs = text.split("\n");
  const firstLineReadsAsTitle = paragraphs.length > 1 && paragraphs[0].length <= 120;

  return firstLineReadsAsTitle
    ? { title: paragraphs[0], description: paragraphs.slice(1).join("\n") }
    : { title: formatLabel, description: text };
}

export function captionPreview(caption: string | null, fallback = "Sin texto") {
  return cleanDisplayCaption(caption).replace(/\n+/g, " ") || fallback;
}
