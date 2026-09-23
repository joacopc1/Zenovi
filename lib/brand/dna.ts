export const OFFER_KINDS = ["service", "infoproduct", "program", "other"] as const;
export type OfferKind = (typeof OFFER_KINDS)[number];

export type OfferDraft = {
  name: string;
  kind: OfferKind;
  description: string;
  priceCents: number | null;
  currency: string;
  modality: string;
  isPrimary: boolean;
};

export type AudienceDraft = {
  name: string;
  description: string;
  pains: string[];
  desires: string[];
  objections: string[];
  isPrimary: boolean;
};

export type BrandDnaDraft = {
  description: string;
  niche: string;
  positioning: string;
  tone: string;
  ownWords: string[];
  avoidedWords: string[];
  differentiators: string[];
  mechanism: string;
  allowedPromises: string[];
  proof: string[];
  objective: string;
  primaryCta: string;
  conversionChannels: string[];
  offers: OfferDraft[];
  audience: AudienceDraft[];
};

export type BrandDnaFieldErrors = Partial<Record<keyof BrandDnaDraft, string>>;

export type BrandDnaValidation =
  | { ok: true; value: BrandDnaDraft }
  | { ok: false; errors: BrandDnaFieldErrors };

export const BRAND_DIMENSION_IDS = [
  "identidad",
  "voz",
  "diferenciacion",
  "objetivo",
  "ofertas",
  "cliente",
] as const;

export type BrandDnaDimensionId = (typeof BRAND_DIMENSION_IDS)[number];

export type BrandDnaDimension = {
  id: BrandDnaDimensionId;
  completed: number;
  total: number;
};

export type BrandDnaCompleteness = {
  dimensions: BrandDnaDimension[];
  completed: number;
  total: number;
  /** 0..1, redondeado al entero más cercano. */
  percent: number;
};

/**
 * Mide cuán completo está cada dimensión del ADN. Una dimensión "completa" no es
 * una métrica de calidad, es una señal de navegación: qué nodos del mapa quedaron
 * por rellenar. No convierte ausencia en cero hacia afuera: el total siempre parte
 * de campos que existen.
 */
export function measureBrandDna(draft: BrandDnaDraft): BrandDnaCompleteness {
  const dimensions: BrandDnaDimension[] = [
    {
      id: "identidad",
      completed: count([hasText(draft.description), hasText(draft.niche), hasText(draft.positioning)]),
      total: 3,
    },
    {
      id: "voz",
      completed: count([hasText(draft.tone), hasList(draft.ownWords), hasList(draft.avoidedWords)]),
      total: 3,
    },
    {
      id: "diferenciacion",
      completed: count([
        hasList(draft.differentiators),
        hasText(draft.mechanism),
        hasList(draft.allowedPromises),
        hasList(draft.proof),
      ]),
      total: 4,
    },
    {
      id: "objetivo",
      completed: count([hasText(draft.objective), hasText(draft.primaryCta), hasList(draft.conversionChannels)]),
      total: 3,
    },
    {
      id: "ofertas",
      completed: draft.offers.length > 0 ? 1 : 0,
      total: 1,
    },
    {
      id: "cliente",
      completed: draft.audience.length > 0 ? 1 : 0,
      total: 1,
    },
  ];

  const completed = dimensions.reduce((sum, dimension) => sum + dimension.completed, 0);
  const total = dimensions.reduce((sum, dimension) => sum + dimension.total, 0);

  return {
    dimensions,
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function hasList(value: string[]): boolean {
  return value.length > 0;
}

function count(values: boolean[]): number {
  return values.filter(Boolean).length;
}

export const EMPTY_BRAND_DNA: BrandDnaDraft = {
  description: "",
  niche: "",
  positioning: "",
  tone: "",
  ownWords: [],
  avoidedWords: [],
  differentiators: [],
  mechanism: "",
  allowedPromises: [],
  proof: [],
  objective: "",
  primaryCta: "",
  conversionChannels: [],
  offers: [],
  audience: [],
};

const LIMITS = {
  text: 2000,
  line: 300,
  listItems: 20,
  listItemLength: 80,
  offers: 12,
  audience: 5,
} as const;

export function emptyOffer(): OfferDraft {
  return { name: "", kind: "service", description: "", priceCents: null, currency: "USD", modality: "", isPrimary: false };
}

export function emptyAudience(): AudienceDraft {
  return { name: "", description: "", pains: [], desires: [], objections: [], isPrimary: false };
}

/**
 * Normaliza una entrada no confiable (FormData serializado del cliente) a un
 * `BrandDnaDraft` limpio o devuelve errores por campo. Nunca confía en la forma
 * de los datos que llegan: corta por longitud, descarta ítems vacíos y limita
 * la cantidad de ofertas y segmentos de audiencia.
 */
export function sanitizeBrandDna(raw: unknown): BrandDnaValidation {
  const source = asRecord(raw);
  const offers = sanitizeOffers(source.offers);
  const audience = sanitizeAudience(source.audience);
  const errors: BrandDnaFieldErrors = {};

  if (offers.length > LIMITS.offers) {
    errors.offers = `Máximo ${LIMITS.offers} ofertas.`;
  }
  if (audience.length > LIMITS.audience) {
    errors.audience = `Máximo ${LIMITS.audience} segmentos de audiencia.`;
  }

  const value: BrandDnaDraft = {
    description: sanitizeText(source.description, LIMITS.text),
    niche: sanitizeText(source.niche, LIMITS.line),
    positioning: sanitizeText(source.positioning, LIMITS.line),
    tone: sanitizeText(source.tone, LIMITS.text),
    ownWords: sanitizeList(source.ownWords, LIMITS.listItems, LIMITS.listItemLength),
    avoidedWords: sanitizeList(source.avoidedWords, LIMITS.listItems, LIMITS.listItemLength),
    differentiators: sanitizeList(source.differentiators, LIMITS.listItems, LIMITS.listItemLength),
    mechanism: sanitizeText(source.mechanism, LIMITS.text),
    allowedPromises: sanitizeList(source.allowedPromises, LIMITS.listItems, LIMITS.listItemLength),
    proof: sanitizeList(source.proof, LIMITS.listItems, LIMITS.listItemLength),
    objective: sanitizeText(source.objective, LIMITS.line),
    primaryCta: sanitizeText(source.primaryCta, LIMITS.line),
    conversionChannels: sanitizeList(source.conversionChannels, LIMITS.listItems, LIMITS.listItemLength),
    offers,
    audience,
  };

  return Object.keys(errors).length === 0 ? { ok: true, value } : { ok: false, errors };
}

function sanitizeOffers(raw: unknown): OfferDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const source = asRecord(item);
    const name = sanitizeText(source.name, LIMITS.line);
    if (!name) return [];
    return [
      {
        name,
        kind: isOfferKind(source.kind) ? source.kind : "service",
        description: sanitizeText(source.description, LIMITS.text),
        priceCents: sanitizePrice(source.priceCents),
        currency: sanitizeText(source.currency, 8).toUpperCase() || "USD",
        modality: sanitizeText(source.modality, LIMITS.line),
        isPrimary: source.isPrimary === true,
      },
    ];
  });
}

function sanitizeAudience(raw: unknown): AudienceDraft[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const source = asRecord(item);
    const name = sanitizeText(source.name, LIMITS.line);
    if (!name) return [];
    return [
      {
        name,
        description: sanitizeText(source.description, LIMITS.text),
        pains: sanitizeList(source.pains, LIMITS.listItems, LIMITS.listItemLength),
        desires: sanitizeList(source.desires, LIMITS.listItems, LIMITS.listItemLength),
        objections: sanitizeList(source.objections, LIMITS.listItems, LIMITS.listItemLength),
        isPrimary: source.isPrimary === true,
      },
    ];
  });
}

function sanitizePrice(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const cents = Math.round(value);
  if (cents < 0) return null;
  return cents;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function sanitizeList(value: unknown, maxItems: number, maxItemLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .map((item) => sanitizeText(item, maxItemLength))
    .filter((item) => item.length > 0);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) return {};
  return value as Record<string, unknown>;
}

export function isOfferKind(value: unknown): value is OfferKind {
  return (
    typeof value === "string" &&
    (OFFER_KINDS as readonly string[]).includes(value)
  );
}
