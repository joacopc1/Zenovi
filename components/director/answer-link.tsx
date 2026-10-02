import Link from "next/link";
import type { ComponentProps } from "react";

/** Una pieza citada por el Director es un chip que la abre; un enlace externo se abre aparte. */
export function AnswerLink({ href, children }: ComponentProps<"a">) {
  if (href?.startsWith("/content/")) {
    return (
      <Link
        href={href}
        className="inline-flex items-center rounded-full border border-mist bg-canvas px-2 py-0.5 text-[13px] font-medium text-ink no-underline transition-colors hover:border-mist-strong hover:bg-paper"
      >
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-ink underline underline-offset-2">
      {children}
    </a>
  );
}
