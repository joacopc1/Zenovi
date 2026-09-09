import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand/brand-mark";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page min-h-screen bg-white px-5 py-12 text-ink">
      <section className="mx-auto w-full max-w-[400px]">
        <Link
          href="/login"
          className="mx-auto flex w-fit items-center gap-2.5"
          aria-label="Zenovi"
        >
          <BrandMark />
          <span className="text-[17px] font-semibold tracking-[-0.025em]">Zenovi</span>
        </Link>

        <div className="mt-9 sm:mt-10">{children}</div>
      </section>
    </main>
  );
}
