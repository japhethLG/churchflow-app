"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatCompact, formatCurrency } from "@/lib/format-currency";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];
type ByType = components["schemas"]["TransactionSummaryByTypeDto"];
type ByMonth = components["schemas"]["TransactionSummaryByMonthDto"];

const TYPE_LABEL: Record<ByType["type"], string> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

/** CSS variables — Recharts consumes these in SVG / stroke */
const TYPE_COLOR: Record<ByType["type"], string> = {
  TITHE: "var(--tx-tithe)",
  OFFERING: "var(--tx-offering)",
  MISSION_GIVING: "var(--tx-mission)",
  FIRST_FRUIT: "var(--tx-first-fruit)",
  COMMITMENT: "var(--tx-commitment)",
  DONATION: "var(--tx-donation)",
  OTHER: "var(--tx-other)",
};

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];



type PeriodOption = { months: number; label: string };
const PERIOD_OPTIONS: PeriodOption[] = [
  { months: 1, label: "30d" },
  { months: 3, label: "90d" },
  { months: 12, label: "YTD" },
];

const tooltipChrome = {
  backgroundColor: "var(--input)",
  border: "none",
  borderRadius: 8,
  fontSize: 12,
} as const;

const axisMuted = { fontSize: 11, fill: "var(--muted-foreground)" };

export const DashboardCharts = ({
  summary,
  loading,
  months,
  onMonthsChange,
}: {
  summary: Summary | undefined;
  loading?: boolean;
  months: number;
  onMonthsChange: (m: number) => void;
}) => {
  if (loading || !summary) {
    return (
      <div className="mb-6 grid grid-cols-[1.5fr_1fr] gap-4">
        {[0, 1].map((i) => (
          <Card key={i}>
            <div className="mb-4 h-4 w-[120px] animate-pulse rounded bg-secondary" />
            <div className="h-[200px] animate-pulse rounded-lg bg-secondary opacity-50" />
          </Card>
        ))}
      </div>
    );
  }

  const total = summary.total;
  const byMonth: ByMonth[] = summary.byMonth ?? [];
  const byType: ByType[] = summary.byType ?? [];

  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const barData = byMonth.map((m) => {
    const [, mm] = m.month.split("-");
    const monthIdx = parseInt(mm, 10) - 1;
    return {
      label: MONTH_SHORT[monthIdx] ?? m.month,
      total: m.total,
      isCurrent: m.month === currentMonth,
    };
  });

  const donutData = byType
    .filter((b) => b.total > 0)
    .map((b) => ({
      name: TYPE_LABEL[b.type],
      value: b.total,
      color: TYPE_COLOR[b.type],
      pct: total > 0 ? (b.total / total) * 100 : 0,
    }));

  const donutPlaceholder = [
    { name: "No data", value: 1, color: "var(--input)" },
  ];

  return (
    <div className="mb-6 grid grid-cols-[1.5fr_1fr] gap-4">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle title="Monthly trend" />
          <div className="flex gap-1 rounded-full bg-muted p-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.months}
                type="button"
                onClick={() => onMonthsChange(opt.months)}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1 font-inherit text-xs font-medium transition-[box-shadow,background,color]",
                  months === opt.months
                    ? "bg-card text-foreground shadow-sm"
                    : "border-none bg-transparent text-muted-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {barData.length > 0 ? (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={barData} barCategoryGap="20%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--input)" />
                <XAxis dataKey="label" tick={axisMuted} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisMuted}
                  axisLine={false}
                  tickLine={false}
                   tickFormatter={(v) => formatCompact(v)}
                  width={50}
                />
                <Tooltip
                  formatter={(v) => [`${formatCompact(Number(v))}`, "Total"]}
                  contentStyle={tooltipChrome}
                  cursor={{
                    fill: "color-mix(in srgb, var(--accent) 27%, transparent)",
                  }}
                />
                <defs>
                  <linearGradient id="dashBarGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--ring)" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="dashBarGradientActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--ring)" />
                    <stop offset="100%" stopColor="var(--primary)" />
                  </linearGradient>
                </defs>
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.isCurrent ? "url(#dashBarGradientActive)" : "url(#dashBarGradient)"}
                    />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="grid h-[220px] place-items-center text-sm text-muted-foreground">
            No data for this period
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle title="Income breakdown" />
        <div className="flex items-center gap-5">
          <div className="relative h-[200px] w-[200px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData.length > 0 ? donutData : donutPlaceholder}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={1}
                  stroke="none"
                >
                  {(donutData.length > 0 ? donutData : donutPlaceholder).map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _name, ctx) => {
                    const payload = (
                      ctx as { payload?: { name?: string; pct?: number } } | undefined
                    )?.payload;
                    const num = typeof v === "number" ? v : 0;
                    return [
                      `${formatCurrency(num)} (${(payload?.pct ?? 0).toFixed(0)}%)`,
                      payload?.name ?? "",
                    ];
                  }}
                  contentStyle={tooltipChrome}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total
                </div>
                <div className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">
                  {formatCompact(total)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            {donutData.map((x) => (
              <div key={x.name} className="flex items-center gap-2.5 text-[13px]">
                <span
                  className="size-2.5 shrink-0 rounded-sm"
                  style={{ backgroundColor: x.color }}
                />
                <span className="min-w-0 flex-1 text-secondary-foreground">{x.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">{x.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
