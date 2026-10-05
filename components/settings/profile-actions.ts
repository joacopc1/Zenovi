"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "profile-avatars";
// El navegador la achica a 256 px antes de mandarla; esto frena lo que llegue sin pasar por ahí.
const MAX_AVATAR_BYTES = 900 * 1024;
const AVATAR_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export type ProfileActionResult = { error?: string };

/** Cambia el nombre que se ve en Zenovi. La fila es la propia: RLS no deja tocar otra. */
export async function updateDisplayName(name: string): Promise<ProfileActionResult> {
  const clean = name.trim().replace(/\s+/g, " ");
  if (clean.length < 1 || clean.length > 80) return { error: "Escribí un nombre de hasta 80 caracteres." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Tu sesión venció. Volvé a iniciar sesión." };
  const { error } = await supabase.from("profiles").update({ display_name: clean }).eq("id", data.user.id);
  if (error) return { error: "No pudimos guardar el nombre. Probá de nuevo." };
  revalidatePath("/", "layout");
  return {};
}

/**
 * Sube una foto de perfil nueva y borra la anterior. Se valida tipo y tamaño acá, no sólo en
 * el navegador, y se guarda siempre en la carpeta de la persona.
 */
export async function updateAvatar(formData: FormData): Promise<ProfileActionResult> {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Elegí una imagen." };
  const extension = AVATAR_TYPES[file.type];
  if (!extension) return { error: "Usá una imagen JPG, PNG o WebP." };
  if (file.size > MAX_AVATAR_BYTES) return { error: "La imagen es demasiado pesada." };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Tu sesión venció. Volvé a iniciar sesión." };
  const userId = data.user.id;

  const admin = createAdminClient();
  const path = `${userId}/${randomUUID()}.${extension}`;
  const upload = await admin.storage.from(AVATAR_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (upload.error) return { error: "No pudimos subir la foto. Probá de nuevo." };

  const publicUrl = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
  const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
  if (error) {
    await admin.storage.from(AVATAR_BUCKET).remove([path]);
    return { error: "No pudimos guardar la foto. Probá de nuevo." };
  }

  // Las fotos anteriores de la persona ya no se usan.
  const { data: previous } = await admin.storage.from(AVATAR_BUCKET).list(userId);
  const stale = (previous ?? []).map((item) => `${userId}/${item.name}`).filter((item) => item !== path);
  if (stale.length) await admin.storage.from(AVATAR_BUCKET).remove(stale);

  revalidatePath("/", "layout");
  return {};
}
