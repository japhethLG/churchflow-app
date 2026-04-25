"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { StatCard } from "@/components/primitives";
import type { components } from "@/lib/api";

type Summary = components["schemas"]["TransactionSummaryResponseDto"];

function fmtCurrency(value: number, currency: string): string {
  return `${currency} ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(0)}k`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(0);
}

export function DashboardKpiStrip({
  summary,
  previousSummary,
  memberCount,
  newMembersThisMonth,
  activeCampaignCount,
  loading,
}: {
  summary: Summary | undefined;
  previousSummary: Summary | undefined;
  memberCount: number;
  newMembersThisMonth?: number;
  activeCampaignCount: number;
  loading?: boolean;
}) {
  if (loading || !summary) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: S.surfaceContainerLowest,
              borderRadius: 16,
              padding: 24,
              minHeight: 120,
            }}
          >
            <div style={{ height: 12, width: 80, background: S.surfaceContainer, borderRadius: 4, marginBottom: 16 }} />
            <div style={{ height: 32, width: 120, background: S.surfaceContainer, borderRadius: 6 }} />
          </div>
        ))}
      </div>
    );
  }

  const total = summary.total;
  const count = summary.count;

  // Delta computation
  const prevTotal = previousSummary?.total ?? 0;
  const delta = prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100) : undefined;
  const deltaStr = delta !== undefined ? `${Math.abs(delta).toFixed(0)}%` : undefined;
  const deltaDir = delta !== undefined ? (delta > 0 ? "up" : delta < 0 ? "down" : "flat") : undefined;

  const prevCount = previousSummary?.count ?? 0;
  const countDelta = prevCount > 0 ? ((count - prevCount) / prevCount * 100) : undefined;
  const countDeltaStr = countDelta !== undefined ? `${Math.abs(countDelta).toFixed(0)}%` : undefined;
  const countDeltaDir = countDelta !== undefined ? (countDelta > 0 ? "up" : countDelta < 0 ? "down" : "flat") : undefined;

  // Unique givers estimate (we use count as proxy — actual unique would need backend)
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
      <StatCard
        label="Total this month"
        value={
          <span
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            <span style={{ opacity: 0.6, marginRight: 2 }}>{summary.currency} </span>
            {fmtCompact(total)}
          </span>
        }
        delta={deltaStr}
        deltaDirection={deltaDir as "up" | "down" | "flat" | undefined}
        caption={prevTotal > 0 ? `vs. ${fmtCurrency(prevTotal, summary.currency)} last month` : undefined}
      />
      <StatCard
        label="Gifts this month"
        value={count.toString()}
        delta={countDeltaStr}
        deltaDirection={countDeltaDir as "up" | "down" | "flat" | undefined}
        caption={`${count} ${count === 1 ? "transaction" : "transactions"}`}
      />
      <StatCard
        label="Active members"
        value={memberCount.toString()}
        caption={newMembersThisMonth !== undefined ? `${newMembersThisMonth} new this month` : undefined}
      />
      <StatCard
        label="Active campaigns"
        value={activeCampaignCount.toString()}
        caption={activeCampaignCount === 0 ? "No active campaigns" : `${activeCampaignCount} in progress`}
      />
    </div>
  );
}
