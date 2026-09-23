"use server";

import { revalidatePath } from "next/cache";
import {
  isContentStatus,
  nextStatus,
  previousStatus,
  sanitizeContentItem,
  type ContentItemFieldErrors,
} from "@/lib/production/content";
import { createClient } from "@/lib/supabase/server";

export type ContentActionState = {
  status: "idle" | "saved" | "error";
  errors?: ContentItemFieldErrors;
  message?: string;
};

export async function createContentItem(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { status: "error", message: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  // Por dueño y no "el primero que venga": el día que una persona tenga dos marcas,
  // `limit(1)` escribiría la idea en cualquiera de las dos.
  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("created_by", authData.user.id)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return { status: "error", message: "No encontramos tu workspace." };
  }

  const result = sanitizeContentItem(raw);
  if (!result.ok) {
    return { status: "error", errors: result.errors };
  }

  const item = result.value;
  const { error } = await supabase.from("content_items").insert({
    workspace_id: workspace.id,
    title: item.title,
    content_type: item.contentType,
    format: item.format,
    status: item.status,
    target_date: item.targetDate,
    reference_url: item.referenceUrl,
    hook: item.hook,
    development: item.development,
    cta: item.cta,
    source: item.source,
  });

  if (error) {
    return { status: "error", message: "No pudimos guardar la idea." };
  }

  revalidatePath("/production");
  return { status: "saved" };
}

export async function moveContentItem(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const source = asRecord(raw);
  const id = typeof source.id === "string" ? source.id : "";
  const direction = source.direction === "back" ? "back" : "forward";

  if (!id) {
    return { status: "error", message: "Falta identificar la pieza." };
  }

  const supabase = await createClient();
  const { data: item, error: fetchError } = await supabase
    .from("content_items")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !item) {
    return { status: "error", message: "No encontramos la pieza." };
  }

  const current = item.status as string;
  if (!isContentStatus(current)) {
    return { status: "error", message: "El estado de la pieza no es válido." };
  }

  const next = direction === "back" ? previousStatus(current) : nextStatus(current);

  if (next === current) return { status: "idle" };

  const { error } = await supabase.from("content_items").update({ status: next }).eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos mover la pieza." };
  }

  revalidatePath("/production");
  return { status: "saved" };
}

export async function moveContentItemToStatus(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const source = asRecord(raw);
  const id = typeof source.id === "string" ? source.id : "";
  const status = source.status;

  if (!id) {
    return { status: "error", message: "Falta identificar la pieza." };
  }
  if (!isContentStatus(status)) {
    return { status: "error", message: "El estado destino no es válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("content_items").update({ status }).eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos mover la pieza." };
  }

  revalidatePath("/production");
  return { status: "saved" };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) return {};
  return value as Record<string, unknown>;
}

export async function updateContentItem(
  _previousState: ContentActionState,
  raw: unknown,
): Promise<ContentActionState> {
  const source = asRecord(raw);
  const id = typeof source.id === "string" ? source.id : "";

  if (!id) {
    return { status: "error", message: "Falta identificar la pieza." };
  }

  const result = sanitizeContentItem(source);
  if (!result.ok) {
    return { status: "error", errors: result.errors };
  }

  const item = result.value;
  const supabase = await createClient();
  const { error } = await supabase
    .from("content_items")
    .update({
      title: item.title,
      content_type: item.contentType,
      format: item.format,
      target_date: item.targetDate,
      reference_url: item.referenceUrl,
      hook: item.hook,
      development: item.development,
      cta: item.cta,
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos guardar la pieza." };
  }

  revalidatePath("/production");
  return { status: "saved" };
}
