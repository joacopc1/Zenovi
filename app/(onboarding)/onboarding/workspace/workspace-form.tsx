"use client";

import { useActionState } from "react";
import { createWorkspace, type CreateWorkspaceState } from "./actions";

const initialState: CreateWorkspaceState = {};

export function WorkspaceForm() {
  const [state, action, pending] = useActionState(createWorkspace, initialState);

  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label className="block text-xs font-semibold text-graphite" htmlFor="name">
          Nombre de tu marca o workspace
        </label>
        <input
          className="mt-2 h-11 w-full rounded-control border border-mist-strong bg-control px-3.5 text-sm text-ink placeholder:text-muted hover:border-graphite focus:border-ink focus:outline-none"
          id="name"
          name="name"
          type="text"
          autoComplete="organization"
          maxLength={80}
          placeholder="Ej. Joaco Piñeyro"
          disabled={pending}
          required
          autoFocus
        />
      </div>

      <button
        className="h-11 w-full rounded-control bg-ink px-4 text-sm font-semibold text-paper transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Creando…" : "Crear workspace"}
      </button>

      {state.error ? (
        <p className="rounded-control border border-danger/20 bg-danger/5 px-3 py-2.5 text-xs leading-5 text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
