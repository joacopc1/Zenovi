import { CircleAlert, X } from "lucide-react";

/**
 * Cuando algo no salió: un aviso tranquilo, con el texto en tinta y sólo el ícono en rojo.
 * Un párrafo entero en rojo se lee como un error del sistema; esto se lee como un aviso.
 * Los errores de un campo de formulario siguen debajo del campo, chicos y en rojo.
 */
export function Notice({
  children,
  onDismiss,
  className = "",
}: {
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-control border border-mist bg-paper px-3 py-2 text-left text-[13px] leading-5 text-ink shadow-[0_1px_4px_rgba(0,0,0,0.04)] ${className}`}
    >
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" strokeWidth={1.75} />
      <span className="min-w-0 flex-1">{children}</span>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
          className="-mr-1 grid size-5 shrink-0 place-items-center rounded-full text-graphite hover:bg-ink/[0.06] hover:text-ink"
        >
          <X className="size-3.5" strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
}
