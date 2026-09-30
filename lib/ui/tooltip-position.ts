export type TooltipAnchor = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type TooltipSize = {
  width: number;
  height: number;
};

export type ViewportSize = {
  width: number;
  height: number;
};

const GAP = 8;
const VIEWPORT_PADDING = 12;

export function placeTooltip(
  anchor: TooltipAnchor,
  tooltip: TooltipSize,
  viewport: ViewportSize,
) {
  const centeredLeft = (anchor.left + anchor.right - tooltip.width) / 2;
  const left = clamp(
    centeredLeft,
    VIEWPORT_PADDING,
    Math.max(VIEWPORT_PADDING, viewport.width - tooltip.width - VIEWPORT_PADDING),
  );
  const below = anchor.bottom + GAP;
  const fitsBelow = below + tooltip.height <= viewport.height - VIEWPORT_PADDING;
  const side = fitsBelow ? "bottom" : "top";
  const preferredTop = fitsBelow ? below : anchor.top - tooltip.height - GAP;
  const top = clamp(
    preferredTop,
    VIEWPORT_PADDING,
    Math.max(VIEWPORT_PADDING, viewport.height - tooltip.height - VIEWPORT_PADDING),
  );

  return { left, top, side } as const;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
