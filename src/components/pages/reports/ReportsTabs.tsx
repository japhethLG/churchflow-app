"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
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

// ─── Type constants ──────────────────────────────────────────────

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

function fmtCompact(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value.toFixed(0)}`;
}

function fmtCurrency(value: number): string {
  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── By Type Tab ─────────────────────────────────────────────────

export function ReportsByType({
  summary,
  loading,
}: {
  summary: Summary | undefined;
  loading?: boolean;
}) {
  if (loading || !summary) {
    return <LoadingPlaceholder />;
  }

  const total = summary.total;
  const byType = summary.byType ?? [];
  const sorted = [...byType].sort((a, b) => b.total - a.total);

  const donutData = sorted
    .filter((b) => b.total > 0)
    .map((b) => ({
      name: TYPE_LABEL[b.type],
      value: b.total,
      color: TYPE_COLOR[b.type],
      pct: total > 0 ? (b.total / total) * 100 : 0,
    }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16, marginBottom: 24 }}>
      {/* Donut */}
      <Card>
        <SectionTitle title="Distribution" />
        <div style={{ display: "grid", placeItems: "center", padding: "20px 0" }}>
          <div style={{ position: "relative", width: 240, height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData.length > 0 ? donutData : [{ name: "No data", value: 1, color: S.surfaceContainerHigh }]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
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
                    return [`$${fmtCurrency(num)} (${(payload?.pct ?? 0).toFixed(0)}%)`, payload?.name ?? ""];
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
            {/* Center */}
            <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", pointerEvents: "none", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.onSurfaceMuted }}>
                  Total
                </div>
                <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", marginTop: 4 }}>
                  ${fmtCurrency(total)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Ranked list */}
      <Card>
        <SectionTitle title="Ranked by type" />
        <div>
          {sorted.map((r) => {
            const maxTotal = sorted[0]?.total ?? 1;
            const barPct = (r.total / maxTotal) * 100;
            return (
              <div
                key={r.type}
                style={{
                  display: "grid",
                  gridTemplateColumns: "110px 1fr 110px 80px",
                  gap: 14,
                  alignItems: "center",
                  padding: "12px 4px",
                }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLOR[r.type], flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{TYPE_LABEL[r.type]}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: S.surfaceContainerLow, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: "100%",
                      background: TYPE_COLOR[r.type],
                      borderRadius: 3,
                      transition: "width 0.5s ease-out",
                    }}
                  />
                </div>
                <div style={{ textAlign: "right" }}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    <span style={{ opacity: 0.6 }}>$</span>
                    {fmtCurrency(r.total)}
                  </span>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontSize: 12,
                    color: S.onSurfaceMuted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.count} gifts
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── By Month Tab ────────────────────────────────────────────────

export function ReportsByMonth({
  summary,
  loading,
}: {
  summary: Summary | undefined;
  loading?: boolean;
}) {
  if (loading || !summary) {
    return <LoadingPlaceholder />;
  }

  const byMonth: ByMonth[] = summary.byMonth ?? [];
  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

  const barData = byMonth.map((m) => {
    const [, mm] = m.month.split("-");
    const monthIdx = parseInt(mm, 10) - 1;
    return {
      label: MONTH_SHORT[monthIdx] ?? m.month,
      total: m.total,
      count: m.count,
      isCurrent: m.month === currentMonth,
      isCurrentLabel: m.month === currentMonth ? " (MTD)" : "",
    };
  });

  return (
    <Card style={{ marginBottom: 24 }}>
      <SectionTitle title="Month-over-month" />
      {barData.length > 0 ? (
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barCategoryGap="16%">
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
                formatter={(v, _name, ctx) => {
                  const payload = ctx?.payload as { count?: number } | undefined;
                  return [`$${fmtCurrency(Number(v))} · ${payload?.count ?? 0} gifts`, ""];
                }}
                labelFormatter={(label, entries) => {
                  const entry = entries?.[0]?.payload as { isCurrentLabel?: string } | undefined;
                  return `${label}${entry?.isCurrentLabel ?? ""}`;
                }}
                contentStyle={{
                  background: S.surfaceContainerHigh,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: `${S.primaryFixed}44` }}
              />
              <defs>
                <linearGradient id="reportBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={S.primaryContainer} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={S.primary} stopOpacity={0.7} />
                </linearGradient>
                <linearGradient id="reportBarActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={S.primaryContainer} />
                  <stop offset="100%" stopColor={S.primary} />
                </linearGradient>
              </defs>
              <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                {barData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.isCurrent ? "url(#reportBarActive)" : "url(#reportBarGradient)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div style={{ height: 200, display: "grid", placeItems: "center", color: S.onSurfaceMuted, fontSize: 14 }}>
          No data for this period
        </div>
      )}
    </Card>
  );
}

// ─── By Member Tab ───────────────────────────────────────────────

type Transaction = components["schemas"]["TransactionResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

export function ReportsByMember({
  transactions,
  membersById,
  currency,
  loading,
}: {
  transactions: Transaction[];
  membersById: Record<string, Member>;
  currency: string;
  loading?: boolean;
}) {
  if (loading) {
    return <LoadingPlaceholder />;
  }

  // Aggregate by memberId
  const byMember: Record<string, { name: string; total: number; count: number }> = {};
  for (const t of transactions) {
    const mid = typeof t.memberId === "string" ? t.memberId : "__anon__";
    const m = mid !== "__anon__" ? membersById[mid] : null;
    const name = m ? `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim() || "Unnamed" : "Anonymous";
    if (!byMember[mid]) byMember[mid] = { name, total: 0, count: 0 };
    byMember[mid].total += t.amount;
    byMember[mid].count += 1;
  }

  const sorted = Object.entries(byMember)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 15);

  const maxTotal = sorted[0]?.[1]?.total ?? 1;

  // Color palette for members
  const MEMBER_COLORS = [
    S.txTithe, S.txOffering, S.txMission, S.txFirstFruit,
    S.txCommitment, S.txDonation, S.info, S.success, S.warning,
  ];

  return (
    <Card style={{ marginBottom: 24 }}>
      <SectionTitle title="Top givers" />
      {sorted.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: S.onSurfaceMuted, fontSize: 14 }}>
          No transactions found.
        </div>
      ) : (
        <div>
          {sorted.map(([mid, data], idx) => {
            const barPct = (data.total / maxTotal) * 100;
            const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
            return (
              <div
                key={mid}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 160px 1fr 110px 80px",
                  gap: 14,
                  alignItems: "center",
                  padding: "11px 4px",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: S.onSurfaceMuted,
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                  }}
                >
                  {idx + 1}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {data.name}
                </span>
                <div style={{ height: 6, borderRadius: 3, background: S.surfaceContainerLow, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: "100%",
                      background: color,
                      borderRadius: 3,
                      transition: "width 0.5s ease-out",
                    }}
                  />
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ opacity: 0.6 }}>{currency} </span>
                    {fmtCurrency(data.total)}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: S.onSurfaceMuted, fontVariantNumeric: "tabular-nums" }}>
                  {data.count} gifts
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── By Campaign Tab ─────────────────────────────────────────────

type Campaign = components["schemas"]["CampaignResponseDto"];

export function ReportsByCampaign({
  transactions,
  campaignsById,
  currency,
  loading,
}: {
  transactions: Transaction[];
  campaignsById: Record<string, Campaign>;
  currency: string;
  loading?: boolean;
}) {
  if (loading) {
    return <LoadingPlaceholder />;
  }

  // Aggregate by campaignId
  const byCampaign: Record<string, { name: string; total: number; count: number }> = {};
  for (const t of transactions) {
    const cid = typeof t.campaignId === "string" ? t.campaignId : "__none__";
    const c = cid !== "__none__" ? campaignsById[cid] : null;
    const name = c ? c.title : "Unattributed";
    if (!byCampaign[cid]) byCampaign[cid] = { name, total: 0, count: 0 };
    byCampaign[cid].total += t.amount;
    byCampaign[cid].count += 1;
  }

  const sorted = Object.entries(byCampaign)
    .sort(([, a], [, b]) => b.total - a.total);

  const maxTotal = sorted[0]?.[1]?.total ?? 1;

  const CAMPAIGN_COLORS = [
    S.txTithe, S.txMission, S.txFirstFruit, S.txCommitment,
    S.txDonation, S.info, S.success, S.warning,
  ];

  return (
    <Card style={{ marginBottom: 24 }}>
      <SectionTitle title="By campaign" />
      {sorted.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: S.onSurfaceMuted, fontSize: 14 }}>
          No transactions found.
        </div>
      ) : (
        <div>
          {sorted.map(([cid, data], idx) => {
            const barPct = (data.total / maxTotal) * 100;
            const color = CAMPAIGN_COLORS[idx % CAMPAIGN_COLORS.length];
            return (
              <div
                key={cid}
                style={{
                  display: "grid",
                  gridTemplateColumns: "28px 180px 1fr 110px 80px",
                  gap: 14,
                  alignItems: "center",
                  padding: "11px 4px",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: S.onSurfaceMuted,
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "right",
                  }}
                >
                  {idx + 1}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    color: cid === "__none__" ? S.onSurfaceMuted : S.onSurface,
                    fontStyle: cid === "__none__" ? "italic" : "normal",
                  }}
                >
                  {data.name}
                </span>
                <div style={{ height: 6, borderRadius: 3, background: S.surfaceContainerLow, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${barPct}%`,
                      height: "100%",
                      background: color,
                      borderRadius: 3,
                      transition: "width 0.5s ease-out",
                    }}
                  />
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ opacity: 0.6 }}>{currency} </span>
                    {fmtCurrency(data.total)}
                  </span>
                </div>
                <div style={{ textAlign: "right", fontSize: 12, color: S.onSurfaceMuted, fontVariantNumeric: "tabular-nums" }}>
                  {data.count} gifts
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ─── Shared loading placeholder ─────────────────────────────────

function LoadingPlaceholder() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16, marginBottom: 24 }}>
      {[0, 1].map((i) => (
        <Card key={i}>
          <div style={{ height: 16, width: 120, background: S.surfaceContainer, borderRadius: 4, marginBottom: 16 }} />
          <div style={{ height: 240, background: S.surfaceContainer, borderRadius: 8, opacity: 0.5 }} />
        </Card>
      ))}
    </div>
  );
}
