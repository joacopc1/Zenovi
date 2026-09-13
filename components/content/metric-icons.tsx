import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function ViewsIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" {...base} {...props}><path d="M2.8 12s3.2-5.2 9.2-5.2S21.2 12 21.2 12 18 17.2 12 17.2 2.8 12 2.8 12Z" /><circle cx="12" cy="12" r="2.4" /></svg>;
}

export function LikeIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" {...base} {...props}><path d="M20.3 5.9a5 5 0 0 0-7.1 0L12 7.1l-1.2-1.2a5 5 0 0 0-7.1 7.1L12 21l8.3-8a5 5 0 0 0 0-7.1Z" /></svg>;
}

export function CommentIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" {...base} {...props}><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9 9 0 0 1-3.4-.7L4 20l1.4-4A7.3 7.3 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /></svg>;
}

export function SaveIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" {...base} {...props}><path d="M6.5 4h11A1.5 1.5 0 0 1 19 5.5V21l-7-4-7 4V5.5A1.5 1.5 0 0 1 6.5 4Z" /></svg>;
}

export function ShareIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" {...base} {...props}><path d="m21 3-7.8 18-2.4-7.8L3 10.8 21 3Z" /><path d="m10.8 13.2 4.4-4.4" /></svg>;
}

export function ExternalIcon(props: IconProps) {
  return <svg viewBox="0 0 24 24" {...base} {...props}><path d="M14 5h5v5M19 5l-8 8" /><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
}
