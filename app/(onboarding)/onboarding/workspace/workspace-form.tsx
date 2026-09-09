"use client";

import { useActionState } from "react";
import {
  AUTH_FIELD_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_PRIMARY_BUTTON_CLASS,
} from "@/components/auth/form-styles";
import { createWorkspace, type CreateWorkspaceState } from "./actions";

const initialState: CreateWorkspaceState = {};

export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, initialState);

  return (
    <form action={action} className="space-y-5">
      <div className={AUTH_FIELD_CLASS}>
        <label className="block text-sm font-medium text-ink" htmlFor="name">
          Nombre de la marca
        </label>
        <input
          className={AUTH_INPUT_CLASS}
          id="name"
          name="name"
          type="text"
          autoComplete="organization"
          maxLength={80}
          placeholder="Ej. Mi marca"
          disabled={pending}
          required
          autoFocus
        />
      </div>

      <button
        className={AUTH_PRIMARY_BUTTON_CLASS}
        type="submit"
        disabled={pending}
      >
        {pending ? "Creando…" : "Continuar"}
      </button>

      {state.error ? (
        <p className="rounded-control border border-danger/20 bg-danger/5 px-3 py-2.5 text-xs leading-5 text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
