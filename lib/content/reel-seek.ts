export const REEL_SEEK_EVENT = "zenovi:seek-reel";

export type ReelSeekDetail = { atMs: number };

export function seekReel(atMs: number) {
  window.dispatchEvent(
    new CustomEvent<ReelSeekDetail>(REEL_SEEK_EVENT, { detail: { atMs } }),
  );
}

export function readReelSeekMoment(event: Event) {
  const detail = (event as CustomEvent<Partial<ReelSeekDetail>>).detail;
  return typeof detail?.atMs === "number" ? Math.max(0, detail.atMs) : null;
}
