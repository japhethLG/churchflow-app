"use client";

import Link from "next/link";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Card, SectionTitle, Badge, StatusBadge } from "@/components/primitives";
import type { components } from "@/lib/api";
import { nstr } from "@/lib/api/coerce";

type Campaign = components["schemas"]["CampaignResponseDto"];
type Pledge = components["schemas"]["PledgeResponseDto"];

function fmtCurrency(v: number | string): string {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtCompact(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toFixed(0);
}

const PLEDGE_STATUS_MAP: Record<Pledge["status"], "Active" | "Completed" | "Cancelled"> = {
  ACTIVE: "Active",
  FULFILLED: "Completed",
  CANCELLED: "Cancelled",
};

export function MemberCampaignsPledges({
  campaigns,
  pledges,
  progressMap,
  loading,
  tenantSlug,
  memberId,
}: {
  campaigns: Campaign[];
  pledges: Pledge[];
  progressMap: Record<string, { goalAmount: number; raisedAmount: number; pledgedAmount: number }>;
  loading?: boolean;
  tenantSlug: string;
  memberId?: string;
}) {
  if (loading) {
    return (
      <Card>
        <SectionTitle title="Campaigns & pledges" />
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: 12, marginBottom: 8 }}>
            <div style={{ width: 58, height: 60, borderRadius: 10, background: S.surfaceContainer }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: 160, background: S.surfaceContainer, borderRadius: 4, marginBottom: 8 }} />
              <div style={{ height: 6, background: S.surfaceContainer, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </Card>
    );
  }

  // Only show active campaigns
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const activePledges = pledges.filter((p) => p.status === "ACTIVE");

  // Build a map: campaignId → user's pledges
  const pledgeByCampaign: Record<string, Pledge[]> = {};
  for (const p of activePledges) {
    if (!pledgeByCampaign[p.campaignId]) pledgeByCampaign[p.campaignId] = [];
    pledgeByCampaign[p.campaignId].push(p);
  }

  return (
    <Card>
      <SectionTitle
        title="Campaigns & pledges"
        action={
          <Link
            href={`/${tenantSlug}/member/campaigns`}
            style={{ fontSize: 13, color: S.primary, fontWeight: 500, textDecoration: "none" }}
          >
            Browse campaigns →
          </Link>
        }
      />

      {activeCampaigns.length === 0 && activePledges.length === 0 ? (
        <div style={{ padding: "32px 0", textAlign: "center", color: S.onSurfaceMuted, fontSize: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
          No active campaigns right now.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activeCampaigns.map((c) => {
            const progress = progressMap[c.id];
            const goal = progress?.goalAmount ?? 0;
            const raised = progress?.raisedAmount ?? 0;
            const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
            const myPledges = pledgeByCampaign[c.id] ?? [];
            const myPledgeTotal = myPledges.reduce((s, p) => s + Number(p.pledgedAmount), 0);
            const description = nstr(c.description);
            const deadline = nstr(c.deadline);

            return (
              <Link
                key={c.id}
                href={`/${tenantSlug}/member/campaigns`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    padding: 14,
                    background: S.surfaceContainerLow,
                    borderRadius: 12,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = S.surfaceContainer; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = S.surfaceContainerLow; }}
                >
                  {/* Title row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: S.onSurface,
                        letterSpacing: "-0.01em",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.title}
                    </span>
                    <StatusBadge status="Active" />
                  </div>

                  {/* Description snippet */}
                  {description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: S.onSurfaceMuted,
                        marginBottom: 10,
                        lineHeight: 1.4,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {description}
                    </div>
                  )}

                  {/* Progress bar */}
                  {goal > 0 && (
                    <>
                      <div
                        style={{
                          height: 6,
                          borderRadius: 3,
                          background: S.surfaceContainerLowest,
                          overflow: "hidden",
                          marginBottom: 6,
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
                          marginBottom: 6,
                        }}
                      >
                        <span>{c.currency} {fmtCompact(raised)} raised</span>
                        <span>Goal: {c.currency} {fmtCompact(goal)}</span>
                      </div>
                    </>
                  )}

                  {/* User's pledge info */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                    {myPledgeTotal > 0 ? (
                      <Badge color="indigo">
                        Your pledge: {c.currency} {fmtCurrency(myPledgeTotal)}
                      </Badge>
                    ) : (
                      <Badge color="neutral">No pledge yet</Badge>
                    )}
                    {deadline && (
                      <Badge color="gray">
                        Ends {new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Standalone pledges (not tied to an active campaign shown above) */}
          {activePledges
            .filter((p) => !activeCampaigns.some((c) => c.id === p.campaignId))
            .slice(0, 3)
            .map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "12px 14px",
                  background: S.surfaceContainerLow,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: `${S.tertiary}15`,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📝</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurface }}>
                    Pledge: {p.pledgedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 2 }}>
                    Campaign ID: {p.campaignId.slice(0, 8)}…
                  </div>
                </div>
                <StatusBadge status={PLEDGE_STATUS_MAP[p.status]} />
              </div>
            ))}
        </div>
      )}
    </Card>
  );
}
