import type { ReactNode } from "react";
import { CalendarRange, Globe, MapPin, Users } from "lucide-react";
import type { DemographicSlice } from "@/lib/data/follower-demographics";
import type { ReportModel } from "@/lib/analytics/report-model";
import { ProportionBar } from "../proportion-blocks";
import { PendingPanel, ReportCard } from "../report-blocks";
import { HUNDRED_FOLLOWERS } from "../report-view";

/** Más de seis filas dejan de leerse de un vistazo; el resto vive en el total. */
const TOP_PLACES = 6;

export function AudienceSection({ model }: { model: ReportModel }) {
  const demographics = model.demographics;

  if (demographics === null) {
    return (
      <PendingPanel
        title="Demografía"
        items={["Género", "Edad", "País", "Ciudad"]}
        reason={HUNDRED_FOLLOWERS}
      />
    );
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="Género"
          hint="De cada cien seguidores, cuántos declara Instagram como mujeres, hombres o sin especificar."
        >
          <ProportionBar slices={toSlices(demographics.gender, GENDER_COLORS, ICONS.gender)} />
        </ReportCard>

        <ReportCard title="Edad">
          <ProportionBar slices={toSlices(demographics.age, AGE_COLOR, ICONS.age)} />
        </ReportCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="País"
          hint="Instagram entrega sólo los 45 países más grandes; acá se muestran los seis primeros."
        >
          <ProportionBar
            slices={toSlices(demographics.country.slice(0, TOP_PLACES), PLACE_COLOR, ICONS.country)}
          />
        </ReportCard>

        <ReportCard title="Ciudad">
          <ProportionBar slices={toSlices(demographics.city.slice(0, TOP_PLACES), PLACE_COLOR, ICONS.city)} />
        </ReportCard>
      </div>
    </>
  );
}

const GENDER_COLORS: Record<string, string> = {
  F: "var(--color-series-2)",
  M: "var(--color-series-1)",
  U: "var(--color-series-4)",
};
const AGE_COLOR = "var(--color-series-1)";
const PLACE_COLOR = "var(--color-series-3)";

const ICONS = {
  gender: <Users size={14} strokeWidth={1.75} />,
  age: <CalendarRange size={14} strokeWidth={1.75} />,
  country: <Globe size={14} strokeWidth={1.75} />,
  city: <MapPin size={14} strokeWidth={1.75} />,
};

/** El color puede ser uno solo para toda la dimensión o uno fijo por valor. */
function toSlices(
  slices: readonly DemographicSlice[],
  color: string | Record<string, string>,
  icon: ReactNode,
) {
  return slices.map((slice) => ({
    key: slice.key,
    label: slice.label,
    color: typeof color === "string" ? color : (color[slice.key] ?? PLACE_COLOR),
    value: slice.value,
    share: slice.share,
    icon,
  }));
}
