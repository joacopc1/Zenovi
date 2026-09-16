import type { ReactNode } from "react";
import { Eye, Globe, Heart, SquarePlay, Users } from "lucide-react";
import { buildReportModel } from "@/lib/analytics/report-model";
import type { AnalyticsTab, RangeDays } from "@/lib/analytics/range";
import type { ContentLibraryItem } from "@/lib/content/library";
import type { InstagramDashboardData } from "@/lib/data/instagram-dashboard";
import { AnalyticsTabs } from "./analytics-tabs";
import { AudienceSection } from "./sections/audience-section";
import { CommunitySection } from "./sections/community-section";
import { ContentSection } from "./sections/content-section";
import { EngagementSection } from "./sections/engagement-section";
import { VisibilitySection } from "./sections/visibility-section";

/**
 * Analíticas como informe por pestañas: cada sección responde una pregunta y vive en su
 * propio archivo. Acá sólo se arma el modelo —todas las cifras del período— y se elige
 * qué sección mostrar.
 */
export function AnalyticsReport({
  dashboard,
  contentItems,
  days,
  tab,
}: {
  dashboard: InstagramDashboardData;
  contentItems: ContentLibraryItem[];
  days: RangeDays;
  tab: AnalyticsTab;
}) {
  const model = buildReportModel({ dashboard, contentItems, days });

  const sections: {
    id: AnalyticsTab;
    label: string;
    icon: ReactNode;
    question: string;
    content: ReactNode;
  }[] = [
    {
      id: "visibilidad",
      label: "Visibilidad",
      icon: <Eye size={14} strokeWidth={1.75} />,
      question: "¿Te está descubriendo gente nueva?",
      content: <VisibilitySection model={model} />,
    },
    {
      id: "engagement",
      label: "Engagement",
      icon: <Heart size={14} strokeWidth={1.75} />,
      question: "¿Qué tipo de interacción genera tu contenido?",
      content: <EngagementSection model={model} />,
    },
    {
      id: "contenido",
      label: "Contenido",
      icon: <SquarePlay size={14} strokeWidth={1.75} />,
      question: "¿Qué piezas rindieron más de lo que publicaste?",
      content: <ContentSection model={model} />,
    },
    {
      id: "comunidad",
      label: "Comunidad",
      icon: <Users size={14} strokeWidth={1.75} />,
      question: "¿Estás creciendo y cuándo interactúan más con vos?",
      content: <CommunitySection model={model} />,
    },
    {
      id: "audiencia",
      label: "Audiencia",
      icon: <Globe size={14} strokeWidth={1.75} />,
      question: "¿A quién le hablás?",
      content: <AudienceSection model={model} />,
    },
  ];
  const current = sections.find((section) => section.id === tab) ?? sections[0];

  return (
    <>
      {/* Aire entre el título de la página y las pestañas: son dos niveles distintos. */}
      <div className="mt-6">
        <AnalyticsTabs
          tabs={sections.map(({ id, label, icon }) => ({ id, label, icon }))}
          active={current.id}
          days={days}
        />
      </div>

      <section className="mt-8">
        <h2 className="sr-only">{current.label}</h2>
        <p className="font-support text-[13px] text-graphite">{current.question}</p>
        <div className="mt-4 space-y-4">{current.content}</div>
      </section>
    </>
  );
}
