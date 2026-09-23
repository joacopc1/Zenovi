"use server";

import { revalidatePath } from "next/cache";
import { sanitizeBrandDna, type BrandDnaDraft, type BrandDnaFieldErrors } from "@/lib/brand/dna";
import { createClient } from "@/lib/supabase/server";

export type SaveBrandDnaState = {
  status: "idle" | "saved" | "error";
  errors?: BrandDnaFieldErrors;
  message?: string;
};

export async function saveBrandDna(
  _previousState: SaveBrandDnaState,
  raw: unknown,
): Promise<SaveBrandDnaState> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return { status: "error", message: "Tu sesión venció. Volvé a iniciar sesión." };
  }

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (workspaceError || !workspace) {
    return { status: "error", message: "No encontramos tu workspace." };
  }

  const result = sanitizeBrandDna(raw);
  if (!result.ok) {
    return { status: "error", errors: result.errors };
  }

  const dna = result.value;
  const workspaceId = workspace.id;

  const { error: profileError } = await supabase.from("brand_profiles").upsert(
    {
      workspace_id: workspaceId,
      description: dna.description,
      niche: dna.niche,
      positioning: dna.positioning,
      tone: dna.tone,
      own_words: dna.ownWords,
      avoided_words: dna.avoidedWords,
      differentiators: dna.differentiators,
      mechanism: dna.mechanism,
      allowed_promises: dna.allowedPromises,
      proof: dna.proof,
      objective: dna.objective,
      primary_cta: dna.primaryCta,
      conversion_channels: dna.conversionChannels,
    },
    { onConflict: "workspace_id" },
  );

  if (profileError) {
    return { status: "error", message: "No pudimos guardar el ADN de marca." };
  }

  const [offersResult, audienceResult] = await Promise.all([
    replaceOffers(supabase, workspaceId, dna),
    replaceAudience(supabase, workspaceId, dna),
  ]);

  if (offersResult || audienceResult) {
    return { status: "error", message: "No pudimos guardar las ofertas o la audiencia." };
  }

  revalidatePath("/brand");
  return { status: "saved", message: "ADN de marca guardado." };
}

async function replaceOffers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  dna: BrandDnaDraft,
) {
  const { error: deleteError } = await supabase
    .from("offers")
    .delete()
    .eq("workspace_id", workspaceId);

  if (deleteError) return deleteError;
  if (dna.offers.length === 0) return null;

  const { error } = await supabase.from("offers").insert(
    dna.offers.map((offer) => ({
      workspace_id: workspaceId,
      name: offer.name,
      kind: offer.kind,
      description: offer.description,
      price_cents: offer.priceCents,
      currency: offer.currency,
      modality: offer.modality,
      is_primary: offer.isPrimary,
    })),
  );

  return error;
}

async function replaceAudience(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workspaceId: string,
  dna: BrandDnaDraft,
) {
  const { error: deleteError } = await supabase
    .from("audience_profiles")
    .delete()
    .eq("workspace_id", workspaceId);

  if (deleteError) return deleteError;
  if (dna.audience.length === 0) return null;

  const { error } = await supabase.from("audience_profiles").insert(
    dna.audience.map((segment) => ({
      workspace_id: workspaceId,
      name: segment.name,
      description: segment.description,
      pains: segment.pains,
      desires: segment.desires,
      objections: segment.objections,
      is_primary: segment.isPrimary,
    })),
  );

  return error;
}
