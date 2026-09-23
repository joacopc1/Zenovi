import "server-only";

import type { AudienceDraft, BrandDnaDraft, OfferDraft, OfferKind } from "@/lib/brand/dna";
import { EMPTY_BRAND_DNA, isOfferKind } from "@/lib/brand/dna";
import { createClient } from "@/lib/supabase/server";

type BrandProfileRow = {
  description: string;
  niche: string;
  positioning: string;
  tone: string;
  own_words: string[];
  avoided_words: string[];
  differentiators: string[];
  mechanism: string;
  allowed_promises: string[];
  proof: string[];
  objective: string;
  primary_cta: string;
  conversion_channels: string[];
};

type OfferRow = {
  name: string;
  kind: string;
  description: string;
  price_cents: number | null;
  currency: string;
  modality: string;
  is_primary: boolean;
};

type AudienceRow = {
  name: string;
  description: string;
  pains: string[];
  desires: string[];
  objections: string[];
  is_primary: boolean;
};

/**
 * Lee el ADN de marca de un workspace. Devuelve el borrador completo siempre:
 * cuando todavía no hay fila, entrega los campos vacíos para que el form arranque
 * sin estados de "no existe" adicionales.
 */
export async function getBrandDna(workspaceId: string): Promise<BrandDnaDraft> {
  const supabase = await createClient();
  const [{ data: profile, error: profileError }, { data: offers, error: offersError }, { data: audience, error: audienceError }] =
    await Promise.all([
      supabase
        .from("brand_profiles")
        .select(
          "description, niche, positioning, tone, own_words, avoided_words, differentiators, mechanism, allowed_promises, proof, objective, primary_cta, conversion_channels",
        )
        .eq("workspace_id", workspaceId)
        .maybeSingle(),
      supabase
        .from("offers")
        .select("name, kind, description, price_cents, currency, modality, is_primary")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true }),
      supabase
        .from("audience_profiles")
        .select("name, description, pains, desires, objections, is_primary")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true }),
    ]);

  if (profileError || offersError || audienceError) {
    throw new Error("No pudimos cargar el ADN de marca.");
  }

  const row = (profile ?? null) as BrandProfileRow | null;
  if (!row) return EMPTY_BRAND_DNA;

  return {
    description: row.description,
    niche: row.niche,
    positioning: row.positioning,
    tone: row.tone,
    ownWords: row.own_words ?? [],
    avoidedWords: row.avoided_words ?? [],
    differentiators: row.differentiators ?? [],
    mechanism: row.mechanism,
    allowedPromises: row.allowed_promises ?? [],
    proof: row.proof ?? [],
    objective: row.objective,
    primaryCta: row.primary_cta,
    conversionChannels: row.conversion_channels ?? [],
    offers: ((offers ?? []) as OfferRow[]).map(toOfferDraft),
    audience: ((audience ?? []) as AudienceRow[]).map(toAudienceDraft),
  };
}

function toOfferDraft(row: OfferRow): OfferDraft {
  return {
    name: row.name,
    kind: isOfferKind(row.kind) ? row.kind : ("service" as OfferKind),
    description: row.description,
    priceCents: row.price_cents,
    currency: row.currency,
    modality: row.modality,
    isPrimary: row.is_primary,
  };
}

function toAudienceDraft(row: AudienceRow): AudienceDraft {
  return {
    name: row.name,
    description: row.description,
    pains: row.pains ?? [],
    desires: row.desires ?? [],
    objections: row.objections ?? [],
    isPrimary: row.is_primary,
  };
}
