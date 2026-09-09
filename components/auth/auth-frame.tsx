import Link from "next/link";
import type { ReactNode } from "react";

type AuthFrameProps = {
  title: string;
  description: string;
  children: ReactNode;
  activeTab?: "login" | "register";
  accountContext?: ReactNode;
};

export function AuthFrame({
  title,
  description,
  children,
  activeTab,
  accountContext,
}: AuthFrameProps) {
  return (
    <div>
      <header className={`text-center ${activeTab ? "min-h-[62px]" : ""}`}>
        <h1 className="text-[clamp(1.5rem,1.15rem+1.1vw,1.875rem)] font-semibold leading-tight tracking-[-0.04em]">
          {title}
        </h1>
        {accountContext ? (
          <div className="mt-1.5 inline-flex items-center justify-center gap-1.5 whitespace-nowrap text-sm leading-5">
            <span className="text-muted">{description}</span>
            {accountContext}
          </div>
        ) : (
          <p className="mx-auto mt-1.5 max-w-[36ch] text-sm leading-5 text-muted">
            {description}
          </p>
        )}
      </header>

      {activeTab ? (
        <nav
          className="relative mt-5 grid grid-cols-2 rounded-[13px] bg-[#e9e9e8] p-1 text-sm text-graphite"
          aria-label="Acceso a Zenovi"
        >
          <span
            aria-hidden="true"
            data-active={activeTab}
            className="auth-tab-indicator absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[10px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          />
          <AuthTab href="/login" active={activeTab === "login"}>
            Iniciar sesión
          </AuthTab>
          <AuthTab href="/register" active={activeTab === "register"}>
            Crear cuenta
          </AuthTab>
        </nav>
      ) : null}

      <div className="mt-5">{children}</div>

      <p className="mt-6 text-center text-[11px] leading-5 text-muted">
        Al continuar, aceptás los términos y la política de privacidad de Zenovi.
      </p>
    </div>
  );
}

function AuthTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative z-10 grid min-h-9 place-items-center rounded-[10px] px-3 transition-colors ${
        active ? "font-medium text-ink" : "hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

export function InstagramAccountContext({ username }: { username: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
      <InstagramMark />
      {`@${username.replace(/^@/, "")}`}
    </span>
  );
}

function InstagramMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-[17px] shrink-0"
      fill="none"
    >
      <defs>
        <linearGradient id="instagram-gradient" x1="3" y1="21" x2="21" y2="3">
          <stop stopColor="#FFDC80" />
          <stop offset="0.34" stopColor="#F77737" />
          <stop offset="0.68" stopColor="#C13584" />
          <stop offset="1" stopColor="#5851DB" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#instagram-gradient)" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="4.25" stroke="url(#instagram-gradient)" strokeWidth="2.2" />
      <circle cx="17.6" cy="6.55" r="1.15" fill="#C13584" />
    </svg>
  );
}
