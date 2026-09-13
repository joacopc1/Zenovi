import { getTrendColorClass, type TrendDirection } from "./trend";

type Point = { x: number; y: number };

const chartSizes = {
  compact: { width: 320, height: 132, top: 12, bottom: 104, left: 4, right: 316 },
  detail: { width: 900, height: 300, top: 20, bottom: 252, left: 44, right: 888 },
} as const;

export function TrendChart({
  id,
  values,
  labels,
  label,
  available,
  trend,
  variant = "compact",
  tone = "trend",
}: {
  id: string;
  values: (number | null)[];
  labels: string[];
  label: string;
  available: boolean;
  trend: TrendDirection;
  variant?: keyof typeof chartSizes;
  tone?: "trend" | "data";
}) {
  const size = chartSizes[variant];
  // Cada tramo es una racha de días informados; los huecos separan tramos.
  const segments = toSegments(getPoints(values, size));
  const description = available
    ? `${label} por día: ${values.map((value) => (value === null ? "sin dato" : value)).join(", ")}`
    : `Instagram todavía no devolvió la serie de ${label.toLocaleLowerCase("es")}.`;
  const gridLines = Array.from({ length: variant === "detail" ? 5 : 3 }, (_, index) => {
    const divisions = variant === "detail" ? 4 : 2;
    return size.top + ((size.bottom - size.top) / divisions) * index;
  });
  const maximum = Math.max(...values.filter((value): value is number => value !== null), 0);

  return (
    <svg
      viewBox={`0 0 ${size.width} ${size.height}`}
      role="img"
      aria-label={description}
      className={`${variant === "detail" ? "mt-5 aspect-[3/1] min-h-56 w-full" : "mt-4 h-32 w-full"} overflow-visible ${tone === "data" ? "text-data" : getTrendColorClass(trend)}`}
    >
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {gridLines.map((y, index) => (
        <line
          key={index}
          x1={size.left}
          x2={size.right}
          y1={y}
          y2={y}
          stroke="var(--color-mist)"
          vectorEffect="non-scaling-stroke"
        />
      ))}

      {variant === "detail"
        ? gridLines.map((y, index) => (
            <text
              key={`axis-${index}`}
              x={size.left - 10}
              y={y + 3}
              fill="var(--color-muted)"
              fontSize="9"
              textAnchor="end"
            >
              {formatAxisValue(maximum * (1 - index / 4))}
            </text>
          ))
        : null}

      {available && segments.length > 0 ? (
        segments.map((segment, index) => {
          const linePath = buildSmoothPath(segment, size);
          const first = segment[0];
          const last = segment[segment.length - 1];

          return (
            <g key={`segment-${index}`}>
              <path
                d={`${linePath} L ${last.x} ${size.bottom} L ${first.x} ${size.bottom} Z`}
                fill={`url(#${id})`}
              />
              {segment.length === 1 ? (
                <circle cx={first.x} cy={first.y} r="2" fill="currentColor" />
              ) : (
                <path
                  d={linePath}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </g>
          );
        })
      ) : (
        <line
          x1={size.left}
          x2={size.right}
          y1={size.bottom}
          y2={size.bottom}
          stroke="var(--color-mist-strong)"
          strokeDasharray="4 5"
          vectorEffect="non-scaling-stroke"
        />
      )}

      <text x={size.left} y={size.height - 4} fill="var(--color-muted)" fontSize="9">
        {labels[0] ?? ""}
      </text>
      {variant === "detail" ? (
        <text
          x={(size.left + size.right) / 2}
          y={size.height - 4}
          fill="var(--color-muted)"
          fontSize="9"
          textAnchor="middle"
        >
          {labels[Math.floor(labels.length / 2)] ?? ""}
        </text>
      ) : null}
      <text x={size.right} y={size.height - 4} fill="var(--color-muted)" fontSize="9" textAnchor="end">
        {labels.at(-1) ?? ""}
      </text>
    </svg>
  );
}

function getPoints(
  values: (number | null)[],
  size: (typeof chartSizes)[keyof typeof chartSizes],
): (Point | null)[] {
  const measured = values.filter((value): value is number => value !== null);
  const maximum = Math.max(...measured, 1);
  const xStep = (size.right - size.left) / Math.max(values.length - 1, 1);

  return values.map((value, index) =>
    value === null
      ? null
      : {
          x: size.left + index * xStep,
          y: size.bottom - (Math.max(value, 0) / maximum) * (size.bottom - size.top),
        },
  );
}

/** Agrupa los puntos informados en rachas contiguas, cortando en cada día sin dato. */
function toSegments(points: (Point | null)[]): Point[][] {
  const segments: Point[][] = [];
  let run: Point[] = [];

  for (const point of points) {
    if (point === null) {
      if (run.length > 0) segments.push(run);
      run = [];
      continue;
    }
    run.push(point);
  }

  if (run.length > 0) segments.push(run);
  return segments;
}

function buildSmoothPath(
  points: Point[],
  size: (typeof chartSizes)[keyof typeof chartSizes],
) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const following = points[index + 2] ?? next;
    const controlOne = {
      x: current.x + (next.x - previous.x) / 6,
      y: clamp(current.y + (next.y - previous.y) / 6, size),
    };
    const controlTwo = {
      x: next.x - (following.x - current.x) / 6,
      y: clamp(next.y - (following.y - current.y) / 6, size),
    };

    path += ` C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function clamp(value: number, size: (typeof chartSizes)[keyof typeof chartSizes]) {
  return Math.min(size.bottom, Math.max(size.top, value));
}

function formatAxisValue(value: number) {
  return new Intl.NumberFormat("es-UY", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}
