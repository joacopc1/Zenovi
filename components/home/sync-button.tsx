import type { SVGProps } from "react";

export function SyncButton({ redirectTo }: { redirectTo: string }) {
  return (
    <form action="/api/integrations/instagram/sync" method="post">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button
        type="submit"
        className="flex min-h-8 items-center gap-1.5 rounded-control border border-mist bg-paper px-3 text-xs font-medium text-graphite hover:border-mist-strong hover:text-ink"
      >
        <RefreshIcon className="size-3.5" />
        Actualizar
      </button>
    </form>
  );
}

function RefreshIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
