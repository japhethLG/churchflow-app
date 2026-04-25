"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SANCTUARY as S } from "@/lib/design/tokens";
import type { components } from "@/lib/api";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];
type ByType = components["schemas"]["TransactionSummaryByTypeDto"];

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

function fmtCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(0)}k`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(0);
}

const PERIOD_OPTIONS = [
  { months: 1, label: "MTD" },
  { months: 3, label: "Last 3mo" },
  { months: 12, label: "Last 12mo" },
];

export function TransactionsSummaryCard({
  summary,
  loading,
  months,
  onMonthsChange,
}: {
  summary: Summary | undefined;
  loading?: boolean;
  months: number;
  onMonthsChange: (m: number) => void;
}) {
  if (loading || !summary) {
    return (
      <div
        style={{
          background: S.surfaceContainerLowest,
          borderRadius: 16,
          padding: 24,
          marginBottom: 16,
          minHeight: 168,
          border: `1px solid ${S.surfaceContainer}`,
        }}
      >
        <div style={{ display: "flex", gap: 32 }}>
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div style={{ height: 12, width: 60, background: S.surfaceContainer, borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 28, width: 120, background: S.surfaceContainer, borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const total = summary.total;
  const count = summary.count;
  const average = count > 0 ? total / count : 0;
  const totalForChart = total > 0 ? total : 1; // avoid empty pie
  const chartData = (summary.byType.length > 0
    ? summary.byType
    : ([{ type: "OTHER", total: 1, count: 0 }] as ByType[])
  ).map((b) => ({
    name: TYPE_LABEL[b.type],
    value: b.total,
    color: TYPE_COLOR[b.type],
    pct: total > 0 ? (b.total / total) * 100 : 0,
    count: b.count,
  }));

  return (
    <div
      style={{
        background: S.surfaceContainerLowest,
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        border: `1px solid ${S.surfaceContainer}`,
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 32,
        alignItems: "center",
      }}
    >
      {/* Left: KPIs + period switch */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 18,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: S.onSurfaceMuted,
          }}
        >
          <span>Window</span>
          <span style={{ display: "flex", gap: 4, background: S.surfaceContainerLow, padding: 3, borderRadius: 9999 }}>
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.months}
                type="button"
                onClick={() => onMonthsChange(opt.months)}
                style={{
                  border: "none",
                  background: months === opt.months ? S.surfaceContainerLowest : "transparent",
                  color: months === opt.months ? S.onSurface : S.onSurfaceMuted,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "5px 12px",
                  borderRadius: 9999,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textTransform: "uppercase",
                  boxShadow: months === opt.months ? "0 1px 2px rgba(0,0,0,0.04)" : "none",
                }}
              >
                {opt.label}
              </button>
            ))}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(140px, 1fr))", gap: 32 }}>
          <Kpi
            label="Total received"
            value={
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 600,
                  letterSpacing: "-0.025em",
                  fontVariantNumeric: "tabular-nums",
                  background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                <span style={{ opacity: 0.6, marginRight: 2 }}>{summary.currency} </span>
                {Number(total).toFixed(2)}
              </span>
            }
          />
          <Kpi
            label="Gifts"
            value={
              <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: S.onSurface }}>
                {count}
              </span>
            }
            caption={count === 1 ? "transaction" : "transactions"}
          />
          <Kpi
            label="Average"
            value={
              <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", color: S.onSurface }}>
                <span style={{ opacity: 0.6, marginRight: 2 }}>{summary.currency} </span>
                {Number(average).toFixed(2)}
              </span>
            }
            caption="per gift"
          />
        </div>
      </div>

      {/* Right: donut + breakdown */}
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 160 }}>
          {chartData.slice(0, 4).map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
              <span style={{ color: S.onSurfaceVariant, flex: 1 }}>{d.name}</span>
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  color: S.onSurfaceMuted,
                  fontSize: 11,
                }}
              >
                {d.pct.toFixed(0)}%
              </span>
            </div>
          ))}
          {chartData.length > 4 && (
            <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 2 }}>
              + {chartData.length - 4} more
            </div>
          )}
        </div>

        <div style={{ position: "relative", width: 140, height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={1}
                stroke="none"
              >
                {chartData.map((d) => (
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
          {/* Center label — recharts can't render a centered label without
              custom wiring, so we overlay manually. */}
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
                  fontSize: 10,
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
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  fontVariantNumeric: "tabular-nums",
                  color: S.onSurface,
                  marginTop: 2,
                }}
              >
                {summary.currency} {fmtCompact(total)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, caption }: { label: string; value: React.ReactNode; caption?: string }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: S.onSurfaceMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div>{value}</div>
      {caption && <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 4 }}>{caption}</div>}
    </div>
  );
}
