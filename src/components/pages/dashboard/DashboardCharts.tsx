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
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Card, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";

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

const TYPE_COLOR: Record<ByType["type"], string> = {
  TITHE: S.txTithe,
  OFFERING: S.txOffering,
  MISSION_GIVING: S.txMission,
  FIRST_FRUIT: S.txFirstFruit,
  COMMITMENT: S.txCommitment,
  DONATION: S.txDonation,
  OTHER: S.txOther,
};

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const fmtCompact = (value: number): string  => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

type PeriodOption = { months: number; label: string };
const PERIOD_OPTIONS: PeriodOption[] = [
  { months: 1, label: "30d" },
  { months: 3, label: "90d" },
  { months: 12, label: "YTD" },
];

// Monthly trend recharts bar chart + income breakdown donut side-by-side
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
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 24 }}>
        {[0, 1].map((i) => (
          <Card key={i}>
            <div style={{ height: 16, width: 120, background: S.surfaceContainer, borderRadius: 4, marginBottom: 16 }} />
            <div style={{ height: 200, background: S.surfaceContainer, borderRadius: 8, opacity: 0.5 }} />
          </Card>
        ))}
      </div>
    );
  }

  const total = summary.total;
  const byMonth: ByMonth[] = summary.byMonth ?? [];
  const byType: ByType[] = summary.byType ?? [];

  // Build bar-chart data from byMonth
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

  // Build donut data from byType
  const donutData = byType
    .filter((b) => b.total > 0)
    .map((b) => ({
      name: TYPE_LABEL[b.type],
      value: b.total,
      color: TYPE_COLOR[b.type],
      pct: total > 0 ? (b.total / total) * 100 : 0,
    }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 24 }}>
      {/* Monthly Trend */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <SectionTitle title="Monthly trend" />
          <div
            style={{
              display: "flex",
              gap: 4,
              background: S.surfaceContainerLow,
              padding: 4,
              borderRadius: 9999,
            }}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.months}
                type="button"
                onClick={() => onMonthsChange(opt.months)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 9999,
                  fontSize: 12,
                  fontWeight: 500,
                  background: months === opt.months ? S.surfaceContainerLowest : "transparent",
                  color: months === opt.months ? S.onSurface : S.onSurfaceMuted,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: months === opt.months ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {barData.length > 0 ? (
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={barData} barCategoryGap="20%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={S.surfaceContainerHigh} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: S.onSurfaceMuted }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: S.onSurfaceMuted }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => fmtCompact(v)}
                  width={50}
                />
                <Tooltip
                  formatter={(v) => [`${fmtCompact(Number(v))}`, "Total"]}
                  contentStyle={{
                    background: S.surfaceContainerHigh,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  cursor={{ fill: `${S.primaryFixed}44` }}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={S.primaryContainer} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={S.primary} stopOpacity={0.7} />
                  </linearGradient>
                  <linearGradient id="barGradientActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={S.primaryContainer} />
                    <stop offset="100%" stopColor={S.primary} />
                  </linearGradient>
                </defs>
                <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.isCurrent ? "url(#barGradientActive)" : "url(#barGradient)"}
                    />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{
              height: 220,
              display: "grid",
              placeItems: "center",
              color: S.onSurfaceMuted,
              fontSize: 14,
            }}
          >
            No data for this period
          </div>
        )}
      </Card>

      {/* Income Breakdown Donut */}
      <Card>
        <SectionTitle title="Income breakdown" />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Recharts donut */}
          <div style={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData.length > 0 ? donutData : [{ name: "No data", value: 1, color: S.surfaceContainerHigh }]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={1}
                  stroke="none"
                >
                  {(donutData.length > 0 ? donutData : [{ name: "No data", value: 1, color: S.surfaceContainerHigh }]).map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, _name, ctx) => {
                    const payload = (ctx as { payload?: { name?: string; pct?: number } } | undefined)?.payload;
                    const num = typeof v === "number" ? v : 0;
                    return [`${Number(num).toFixed(2)} (${(payload?.pct ?? 0).toFixed(0)}%)`, payload?.name ?? ""];
                  }}
                  contentStyle={{
                    background: S.surfaceContainerHigh,
                    border: "none",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                pointerEvents: "none",
                textAlign: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: S.onSurfaceMuted,
                  }}
                >
                  Total
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    fontVariantNumeric: "tabular-nums",
                    marginTop: 2,
                  }}
                >
                  {fmtCompact(total)}
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {donutData.map((x) => (
              <div key={x.name} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: x.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: S.onSurfaceVariant }}>{x.name}</span>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{x.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
