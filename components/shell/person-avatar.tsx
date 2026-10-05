import Image from "next/image";
import { User } from "lucide-react";

/** La foto de la cuenta o, si no tiene, el ícono de una persona (nunca una letra). */
export function PersonAvatar({ src, size, className = "" }: { src: string | null; size: number; className?: string }) {
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-control text-graphite ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" unoptimized />
      ) : (
        <User aria-hidden="true" style={{ width: size * 0.55, height: size * 0.55 }} strokeWidth={1.75} />
      )}
    </span>
  );
}
