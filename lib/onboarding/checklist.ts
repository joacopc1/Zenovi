/**
 * Los primeros pasos que se le proponen a una cuenta nueva. Cada uno se marca solo, con lo
 * que la persona ya hizo: no hay que tildar nada a mano.
 */
export type ChecklistFacts = {
  instagramConnected: boolean;
  brandDnaPercent: number;
  analyzedReel: boolean;
  askedDirector: boolean;
  savedIdea: boolean;
};

export type ChecklistItem = { id: string; label: string; href: string; done: boolean };

/** Con la mitad del ADN el Director ya conoce la marca (es el mismo umbral de su aviso). */
const BRAND_DNA_READY_PERCENT = 50;

export function buildChecklist(facts: ChecklistFacts): ChecklistItem[] {
  return [
    { id: "instagram", label: "Conectá tu Instagram", href: "/onboarding/instagram", done: facts.instagramConnected },
    { id: "brand", label: "Completá tu ADN", href: "/brand", done: facts.brandDnaPercent >= BRAND_DNA_READY_PERCENT },
    { id: "analysis", label: "Analizá tu primer Reel", href: "/content", done: facts.analyzedReel },
    { id: "director", label: "Preguntale al Director", href: "/director", done: facts.askedDirector },
    { id: "idea", label: "Guardá una idea", href: "/production", done: facts.savedIdea },
  ];
}
