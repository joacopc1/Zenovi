import type { ReactNode } from "react";
import { countryFlag, type DemographicSlice } from "@/lib/data/follower-demographics";
import type { ReportModel } from "@/lib/analytics/report-model";
import { ProportionBar, SharePie, ShareColumns } from "../proportion-blocks";
import { PendingPanel, ReportCard } from "../report-blocks";
import { HUNDRED_FOLLOWERS } from "../report-view";

/** Más de seis filas dejan de leerse de un vistazo; el resto sigue contando en el total. */
const TOP_PLACES = 6;

/** El color sigue a la categoría: cada género tiene el suyo, fijo. */
const GENDER_COLORS: Record<string, string> = {
  M: "var(--color-series-1)",
  U: "var(--color-series-4)",
  F: "var(--color-series-2)",
};
const AGE_COLOR = "var(--color-series-1)";
const PLACE_COLOR = "var(--color-series-3)";

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
        <ReportCard title="Género">
          <SharePie
            slices={demographics.gender.map((slice) => ({
              ...slice,
              color: GENDER_COLORS[slice.key] ?? AGE_COLOR,
            }))}
          />
        </ReportCard>

        <ReportCard title="Edad">
          <ShareColumns
            slices={demographics.age.map((slice) => ({ ...slice, color: AGE_COLOR }))}
          />
        </ReportCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportCard
          title="País"
          hint="Instagram entrega sólo los 45 países más grandes; acá se muestran los seis primeros."
        >
          <ProportionBar slices={places(demographics.country, (slice) => flagOf(slice))} />
        </ReportCard>

        <ReportCard title="Ciudad">
          <ProportionBar slices={places(demographics.city, () => null)} />
        </ReportCard>
      </div>
    </>
  );
}

function places(slices: readonly DemographicSlice[], icon: (slice: DemographicSlice) => ReactNode) {
  return slices.slice(0, TOP_PLACES).map((slice) => ({
    key: slice.key,
    label: slice.label,
    color: PLACE_COLOR,
    value: slice.value,
    share: slice.share,
    icon: icon(slice),
  }));
}

/** La bandera del país; si el código no es válido, el nombre va solo. */
function flagOf(slice: DemographicSlice) {
  const flag = countryFlag(slice.key);
  return flag === null ? null : <span className="text-[15px] leading-none">{flag}</span>;
}
