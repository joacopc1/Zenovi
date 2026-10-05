import { useId } from "react";

/**
 * El logo de Instagram a color, el mismo del login. Cada uno lleva su propio id de
 * degradé: con dos en la misma página, un id repetido haría que uno pierda el color.
 */
export function InstagramGlyph({ className = "size-[17px]" }: { className?: string }) {
  const gradient = `instagram-gradient-${useId().replace(/:/g, "")}`;
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`shrink-0 ${className}`} fill="none">
      <defs>
        <linearGradient id={gradient} x1="3" y1="21" x2="21" y2="3">
          <stop stopColor="#FFDC80" />
          <stop offset="0.34" stopColor="#F77737" />
          <stop offset="0.68" stopColor="#C13584" />
          <stop offset="1" stopColor="#5851DB" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke={`url(#${gradient})`} strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.25" stroke={`url(#${gradient})`} strokeWidth="2.2" />
      <circle cx="17.6" cy="6.55" r="1.15" fill="#C13584" />
    </svg>
  );
}
