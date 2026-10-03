import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  CalendarClock,
  CalendarX,
  ChartNoAxesCombined,
  ChevronRight,
  Coins,
  FileText,
  Fingerprint,
  Lightbulb,
  MessageCircle,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LinkPendingArrow } from "@/components/ui/link-pending-arrow";
import { AnimatedNumber } from "@/components/analytics/animated-number";
import { DailyChart } from "@/components/analytics/daily-chart";
import { CardTitle } from "@/components/analytics/report-blocks";
import { toPoints, trendOf } from "@/components/analytics/report-view";
import {
  buildRangeHref,
  RANGE_OPTIONS,
  type RangeDays,
} from "@/lib/analytics/range";
import type { ReportModel } from "@/lib/analytics/report-model";
import type { RankedContentItem } from "@/lib/content/library";
import { pieceHref, pieceLabel } from "@/lib/director/account-snapshots";
import {
  formatCompact,
  formatDecimal,
  formatPercent,
} from "@/lib/format/numbers";
import type { AttentionItem, buildActivityGrid, InsightPart } from "@/lib/home/home-model";
import { ActivityHeatmap } from "./activity-heatmap";
import { WeekAgenda, type AgendaItem } from "./week-agenda";

export type WeekStat = {
  label: string;
  hint: string;
  current: number | null;
  previous: number | null;
  /** Lo que se muestra debajo cuando no hay semana anterior con qué comparar. */
  note?: string;
};

/**
 * El Inicio: qué pasó, qué funcionó y qué hacer ahora. Resume y lleva a donde se actúa
 * (Analíticas, Contenido, Producción, el Director); no repite lo que ellos hacen mejor.
 * Las gráficas y tarjetas toman ideas de los dashboards de Efferd que eligió Joaco,
 * pasadas a la paleta clara de Zenovi.
 */
export function HomeOverview({
  week,
  month,
  topPieces,
  activity,
  agenda,
  attention,
  insight,
  questions,
}: {
  week: WeekStat[];
  month: ReportModel;
  topPieces: RankedContentItem[];
  activity: ReturnType<typeof buildActivityGrid>;
  agenda: { days: string[]; today: string; items: AgendaItem[] };
  attention: AttentionItem[];
  insight: InsightPart[];
  questions: string[];
}) {
  return (
    <div className="mt-6 space-y-4">
      <section aria-label="Tu semana" className="grid gap-4 sm:grid-cols-3">
        {week.map((stat) => (
          <WeekStatCard key={stat.label} stat={stat} />
        ))}
      </section>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ViewsTrendCard month={month} />
        <WeekAgenda
          days={agenda.days}
          today={agenda.today}
          items={agenda.items}
        />
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <InsightCard insight={insight} questions={questions} />
        <QuickActionsCard />
      </div>

      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <NeedsAttentionCard items={attention} />
        <ActivityHeatmap {...activity} />
      </div>

      <TopPiecesCard items={topPieces} />
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`flex h-full flex-col rounded-card border border-mist bg-paper p-5 ${className}`}
    >
      {children}
    </section>
  );
}

function TrendChip({ change }: { change: number }) {
  return (
    <span
      className={`font-numeric flex items-center gap-0.5 text-[12px] font-semibold ${
        change > 0 ? "text-success" : change < 0 ? "text-danger" : "text-muted"
      }`}
    >
      {change > 0 ? (
        <ArrowUpRight size={13} strokeWidth={2} aria-hidden />
      ) : null}
      {change < 0 ? (
        <ArrowDownRight size={13} strokeWidth={2} aria-hidden />
      ) : null}
      {formatPercent(Math.abs(change))}
    </span>
  );
}

function WeekStatCard({ stat }: { stat: WeekStat }) {
  const comparable =
    stat.current !== null && stat.previous !== null && stat.previous > 0;
  const change = comparable
    ? (stat.current! - stat.previous!) / stat.previous!
    : null;
  const difference =
    stat.current !== null && stat.previous !== null
      ? stat.current - stat.previous
      : null;
  return (
    <Card>
      <CardTitle
        title={stat.label}
        hint={stat.hint}
        trailing={change === null ? null : <TrendChip change={change} />}
      />
      <p className="mt-3 flex items-baseline gap-2">
        <span className="font-numeric text-[30px] font-bold leading-none tracking-[-0.02em] text-ink">
          <AnimatedNumber value={stat.current} format="compact" />
        </span>
        {difference !== null && comparable ? (
          <span className="text-[12px] text-graphite">
            <span
              className={`font-numeric font-semibold ${difference > 0 ? "text-success" : difference < 0 ? "text-danger" : ""}`}
            >
              {difference > 0 ? "+" : difference < 0 ? "−" : ""}
              {formatCompact(Math.abs(difference))}
            </span>{" "}
            contra la semana pasada
          </span>
        ) : (
          <span className="text-[12px] text-graphite">
            {stat.note ?? "Sin semana anterior para comparar"}
          </span>
        )}
      </p>
    </Card>
  );
}

function ViewsTrendCard({ month }: { month: ReportModel }) {
  const trend = trendOf(month.views);
  return (
    <Card>
      <CardTitle
        title="Visualizaciones"
        hint="Cuántas veces se vio tu contenido cada día."
        trailing={<RangeToggle days={month.days as RangeDays} />}
      />
      <div className="mt-3 flex items-center gap-2">
        <span className="font-numeric text-[30px] font-bold leading-none tracking-[-0.02em]">
          <AnimatedNumber value={month.views.current} format="compact" />
        </span>
        {trend?.percentage != null ? (
          <TrendChip change={trend.percentage / 100} />
        ) : null}
      </div>
      <div className="mt-4 flex-1">
        <DailyChart
          label="Visualizaciones por día"
          mode="line"
          series={[
            {
              key: "views",
              label: "Visualizaciones",
              color: "var(--color-graphite)",
            },
          ]}
          fadeArea
          points={toPoints(month.window, ["views"])}
        />
      </div>
      <FooterLink href="/analytics">Ver en Analíticas</FooterLink>
    </Card>
  );
}

/** El período de la gráfica, igual que en Analíticas: vive en la dirección (`/?days=7`). */
function RangeToggle({ days }: { days: RangeDays }) {
  return (
    <div
      className="flex items-center rounded-control bg-canvas p-0.5"
      role="group"
      aria-label="Período"
    >
      {RANGE_OPTIONS.map((option) => (
        <Link
          key={option}
          href={buildRangeHref("/", option)}
          scroll={false}
          aria-current={option === days ? "true" : undefined}
          className={`font-numeric rounded-[6px] px-2 py-0.5 text-[12px] font-medium ${
            option === days
              ? "bg-paper text-ink shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              : "text-graphite hover:text-ink"
          }`}
        >
          {option} días
        </Link>
      ))}
    </div>
  );
}

function InsightCard({
  insight,
  questions,
}: {
  insight: InsightPart[];
  questions: string[];
}) {
  const sentence = insight.map((part) => part.text).join("");
  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
          <Activity aria-hidden="true" className="size-4" strokeWidth={1.7} />
          Insight
        </h2>
        <Link
          href={`/director?pregunta=${encodeURIComponent(`${sentence} ¿Qué hago con esto?`)}`}
          className="flex items-center gap-1.5 rounded-control px-2 py-1 text-[13px] font-medium text-graphite hover:bg-ink/[0.04] hover:text-ink"
        >
          <MessageCircle
            aria-hidden="true"
            className="size-4"
            strokeWidth={1.75}
          />
          Preguntar al Director
        </Link>
      </div>
      {/* La frase ocupa el alto libre y queda centrada entre el título y las preguntas. */}
      <div className="flex flex-1 items-center py-4">
        <p className="text-[22px] font-medium leading-[1.35] tracking-[-0.015em] text-graphite">
          {insight.map((part, index) =>
            part.strong ? (
              <strong key={index} className="font-semibold text-ink">
                {part.text}
              </strong>
            ) : (
              <span key={index}>{part.text}</span>
            ),
          )}
        </p>
      </div>
      {questions.length ? (
        <ul className="flex flex-wrap gap-2">
          {questions.map((question) => (
            <li key={question}>
              <Link
                href={`/director?pregunta=${encodeURIComponent(question)}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-mist px-3 py-1.5 text-[12px] text-ink transition-colors hover:border-ink/25 hover:bg-ink/[0.02]"
              >
                {question}
                <ArrowRight
                  aria-hidden="true"
                  className="size-3 text-ink/40"
                  strokeWidth={1.75}
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

const ATTENTION_ICONS: Record<string, ReactNode> = {
  overdue: (
    <CalendarClock aria-hidden="true" className="size-4" strokeWidth={1.75} />
  ),
  failed: (
    <TriangleAlert aria-hidden="true" className="size-4" strokeWidth={1.75} />
  ),
  brand: (
    <Fingerprint aria-hidden="true" className="size-4" strokeWidth={1.75} />
  ),
  credits: <Coins aria-hidden="true" className="size-4" strokeWidth={1.75} />,
  script: <FileText aria-hidden="true" className="size-4" strokeWidth={1.75} />,
  analysis: (
    <ScanSearch aria-hidden="true" className="size-4" strokeWidth={1.75} />
  ),
  posting: (
    <CalendarX aria-hidden="true" className="size-4" strokeWidth={1.75} />
  ),
};

function NeedsAttentionCard({ items }: { items: AttentionItem[] }) {
  return (
    <Card>
      <CardTitle title="Necesita atención" />
      {items.length === 0 ? (
        <EmptyState
          illustration="caught-up"
          title="Estás al día"
          description="No quedó nada a medio hacer: ideas con guion, Reels analizados y publicaciones al ritmo."
        />
      ) : (
        <ul className="mt-3 -mx-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-ink/[0.03]"
              >
                <span className="text-ink">{ATTENTION_ICONS[item.id]}</span>
                <span className="min-w-0 flex-1 text-[13px] font-medium text-ink">
                  {item.label}
                </span>
                <span className="font-numeric grid min-w-6 place-items-center rounded-full bg-canvas px-1.5 py-0.5 text-[12px] font-semibold text-ink">
                  {item.badge}
                </span>
                <LinkPendingArrow />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/**
 * Las piezas de las últimas dos semanas que más superaron tu habitual, en lista como el
 * "Top products" de Efferd: la portada para reconocerla de un vistazo, sus visualizaciones,
 * cuánto rindió contra lo habitual y un atajo para preguntarle al Director por qué.
 */
function TopPiecesCard({ items }: { items: RankedContentItem[] }) {
  return (
    <Card>
      <CardTitle
        title="Lo que mejor te funcionó"
        trailing={
          items.length ? (
            <Link
              href={contentListHref(items[0])}
              className="flex items-center gap-1 text-[13px] font-medium text-graphite hover:text-ink"
            >
              Ver todo
              <ArrowRight
                aria-hidden="true"
                className="size-3.5"
                strokeWidth={1.75}
              />
            </Link>
          ) : null
        }
      />
      {items.length === 0 ? (
        <EmptyState
          illustration="spotlight"
          title="Todavía no hay una pieza destacada"
          description="Cuando publiques en estas dos semanas, acá aparecen las que más superaron tu habitual."
          action={
            <Link
              href={`/director?pregunta=${encodeURIComponent("Dame 3 ideas para grabar esta semana.")}`}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-control border border-mist px-3 text-[13px] font-medium text-ink hover:bg-canvas"
            >
              <Bot aria-hidden="true" className="size-4" strokeWidth={1.75} />
              Pedir ideas al Director
            </Link>
          }
        />
      ) : (
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="border-b border-mist text-[12px] text-graphite">
              <th scope="col" className="pb-2 font-medium">
                Pieza
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Visualizaciones
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                Contra tu habitual
              </th>
              <th scope="col" className="pb-2">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const label = pieceLabel(item);
              const above = item.multiplier! >= 1;
              return (
                <tr
                  key={item.id}
                  className="border-b border-mist last:border-0"
                >
                  <td className="py-2.5">
                    <Link
                      href={pieceHref(item)}
                      className="flex items-center gap-3"
                    >
                      <span className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-canvas">
                        {item.thumbnailUrl ? (
                          <Image
                            src={item.thumbnailUrl}
                            alt=""
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-ink">
                          {label}
                        </span>
                        {item.caption ? (
                          <span className="block max-w-[28ch] truncate text-[12px] text-graphite">
                            {item.caption}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </td>
                  <td className="font-numeric py-2.5 text-right text-[13px] font-semibold text-ink">
                    {formatCompact(item.views)}
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`font-numeric inline-flex items-center gap-0.5 text-[13px] font-semibold ${above ? "text-success" : "text-danger"}`}
                    >
                      {above ? (
                        <ArrowUpRight size={13} strokeWidth={2} aria-hidden />
                      ) : (
                        <ArrowDownRight size={13} strokeWidth={2} aria-hidden />
                      )}
                      {formatDecimal(item.multiplier)}×
                    </span>
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <Link
                      href={`/director?pieza=${encodeURIComponent(item.id)}`}
                      className="inline-flex items-center gap-1 rounded-control border border-mist px-2.5 py-1 text-[12px] font-medium text-ink hover:bg-canvas"
                    >
                      Preguntar
                      <ChevronRight
                        aria-hidden="true"
                        className="size-3.5"
                        strokeWidth={1.75}
                      />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/production",
    icon: Lightbulb,
    title: "Anotar una idea",
    description: "Guardala en Producción.",
  },
  {
    href: "/content",
    icon: ScanSearch,
    title: "Analizar un Reel",
    description: "Qué funcionó y qué cambiar.",
  },
  {
    href: "/director",
    icon: Bot,
    title: "Hablar con el Director",
    description: "Ideas y guiones con tus datos.",
  },
  {
    href: "/analytics",
    icon: ChartNoAxesCombined,
    title: "Ver tus Analíticas",
    description: "Cómo vienen tus números.",
  },
];

/** Atajos a lo que más se hace, como las acciones rápidas del Dashboard 10 de Efferd. */
function QuickActionsCard() {
  return (
    <Card>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
        Accesos rápidos
      </h2>
      <ul className="-mx-2 mt-3">
        {QUICK_ACTIONS.map(({ href, icon: Icon, title, description }) => (
          <li key={href}>
            <Link
              href={href}
              className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-ink/[0.03]"
            >
              <Icon
                aria-hidden="true"
                className="size-4 shrink-0 text-ink"
                strokeWidth={1.75}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-ink">
                  {title}
                </span>
                <span className="block text-[12px] text-graphite">
                  {description}
                </span>
              </span>
              <LinkPendingArrow />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** "Ver todo" abre Contenido en el formato de la mejor pieza, ordenado por rendimiento. */
function contentListHref(item: RankedContentItem) {
  return item.kind === "reel"
    ? "/content?sort=multiplier"
    : `/content?type=${item.kind}&sort=multiplier`;
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-medium text-ink hover:underline"
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={1.75} />
    </Link>
  );
}
