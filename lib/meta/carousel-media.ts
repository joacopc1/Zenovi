export type CarouselMediaChild = {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string | null;
  thumbnailUrl: string | null;
};

/** Lee únicamente los campos de slide que Zenovi sabe presentar. */
export function parseCarouselMediaChildren(value: unknown): CarouselMediaChild[] {
  if (!isRecord(value) || !Array.isArray(value.data)) return [];

  return value.data.flatMap((child) => {
    if (!isRecord(child)) return [];
    const id = readIdentifier(child.id);
    const mediaType = child.media_type;
    if (!id || (mediaType !== "IMAGE" && mediaType !== "VIDEO")) return [];

    return [{
      id,
      mediaType,
      mediaUrl: readString(child.media_url),
      thumbnailUrl: readString(child.thumbnail_url),
    }];
  });
}

function readIdentifier(value: unknown) {
  if (typeof value === "string" && /^\d+$/.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 0) {
    return String(value);
  }
  return null;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
