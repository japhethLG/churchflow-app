"use client";

import Link from "next/link";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Card, SectionTitle, Badge, StatusBadge } from "@/components/primitives";
import type { components } from "@/lib/api";

type Campaign = components["schemas"]["CampaignResponseDto"];

type CampaignWithProgress = Campaign & {
  goalAmount?: number;
  raisedAmount?: number;
};

const fmtCompact = (value: number): string  => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(0);
}

const STATUS_MAP: Record<Campaign["status"], "Active" | "Upcoming" | "Completed" | "Cancelled"> = {
  DRAFT: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const DashboardActiveCampaigns = ({
  campaigns,
  progressMap,
  loading,
  tenantSlug,
}: {
  campaigns: Campaign[];
  progressMap: Record<string, { goalAmount: number; raisedAmount: number; pledgedAmount: number }>;
  loading?: boolean;
  tenantSlug: string;
}) => {
  if (loading) {
    return (
      <Card>
        <SectionTitle title="Active campaigns" />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ padding: "12px 8px", display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: S.surfaceContainer }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: 140, background: S.surfaceContainer, borderRadius: 4, marginBottom: 6 }} />
              <div style={{ height: 6, background: S.surfaceContainer, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </Card>
    );
  }

  // Show ACTIVE and DRAFT campaigns, sorted by status then createdAt
  const visible = campaigns
    .filter((c) => c.status === "ACTIVE" || c.status === "DRAFT")
    .slice(0, 5);

  return (
    <Card>
      <SectionTitle
        title="Active campaigns"
        action={
          <Link
            href={`/${tenantSlug}/admin/campaigns`}
            style={{ fontSize: 13, color: S.primary, fontWeight: 500, textDecoration: "none" }}
          >
            View all →
          </Link>
        }
      />
      {visible.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: S.onSurfaceMuted, fontSize: 14 }}>
          No active campaigns.
        </div>
      ) : (
        visible.map((c) => {
          const progress = progressMap[c.id];
          const goal = progress?.goalAmount ?? 0;
          const raised = progress?.raisedAmount ?? 0;
          const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

          return (
            <Link
              key={c.id}
              href={`/${tenantSlug}/admin/campaigns/${c.id}`}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  padding: "12px 8px",
                  borderRadius: 10,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = S.surfaceContainerLow; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {/* Percentage badge */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: S.primaryFixed,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: S.primary,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: S.onSurface,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.title}
                    </span>
                    <StatusBadge status={STATUS_MAP[c.status]} />
                  </div>
                  {/* Progress bar */}
                  <div
                    style={{
                      height: 6,
                      borderRadius: 3,
                      background: S.surfaceContainerLow,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        borderRadius: 3,
                        background: `linear-gradient(90deg, ${S.primaryContainer}, ${S.primary})`,
                        transition: "width 0.5s ease-out",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: S.onSurfaceMuted,
                      marginTop: 4,
                    }}
                  >
                    <span>{c.currency} {fmtCompact(raised)} raised</span>
                    {goal > 0 && <span>Goal: {c.currency} {fmtCompact(goal)}</span>}
                  </div>
                </div>
              </div>
            </Link>
          );
        })
      )}
    </Card>
  );
}
