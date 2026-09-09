"use client";

import { useState, type ComponentProps } from "react";
import { AUTH_INPUT_CLASS } from "./form-styles";

type PasswordInputProps = Omit<ComponentProps<"input">, "type">;

export function PasswordInput({ className = "", ...props }: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);
  const actionLabel = isVisible ? "Ocultar contraseña" : "Mostrar contraseña";

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? "text" : "password"}
        className={`${AUTH_INPUT_CLASS} pr-12 ${className}`}
      />
      <button
        type="button"
        className="absolute inset-y-1 right-1 grid aspect-square place-items-center rounded-[11px] text-muted transition-colors hover:bg-[#f1f1f0] hover:text-ink focus-visible:bg-[#f1f1f0] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={actionLabel}
        aria-pressed={isVisible}
        disabled={props.disabled}
      >
        {isVisible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none">
      <path
        d="M2.75 12s3.25-5.25 9.25-5.25S21.25 12 21.25 12 18 17.25 12 17.25 2.75 12 2.75 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none">
      <path
        d="M3.25 3.25 20.75 20.75M10.1 6.95A9.3 9.3 0 0 1 12 6.75c6 0 9.25 5.25 9.25 5.25a16.7 16.7 0 0 1-2.55 3.1M14.3 16.95c-.72.2-1.49.3-2.3.3C6 17.25 2.75 12 2.75 12a16.2 16.2 0 0 1 3.08-3.53M10.3 10.3a2.4 2.4 0 0 0 3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
