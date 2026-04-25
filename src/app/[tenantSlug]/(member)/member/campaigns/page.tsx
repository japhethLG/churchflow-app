"use client";

import { useParams } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import {
  PageHeader,
  Card,
  Badge,
  StatusBadge,
  Button,
} from "@/components/primitives";
import { useCampaigns, useCampaignProgress } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";
import { useMyMembership } from "@/lib/api/members";
import { useTenant } from "@/lib/api/tenants";
import { useModalStore } from "@/lib/modals/store";
import { nstr } from "@/lib/api/coerce";
import type { components } from "@/lib/api";
import type { MemberPledgeProps } from "@/components/modals/member-pledge";

type Campaign = components["schemas"]["CampaignResponseDto"];

const STATUS_MAP: Record<
  Campaign["status"],
  "Active" | "Upcoming" | "Completed" | "Cancelled"
> = {
  DRAFT: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const fmtCompact = (v: number): string  => {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return Number(v).toFixed(0);
}

const fmtCurrency = (v: number | string): string  => {
  return Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const open = useModalStore((s) => s.open);

  const tenantQ = useTenant(tenantSlug);
  const currency = tenantQ.data?.currency ?? "USD";
  const currencySymbol =
    currency === "USD"
      ? "$"
      : currency === "EUR"
        ? "€"
        : currency === "GBP"
          ? "£"
          : currency;

  const memberQ = useMyMembership(tenantSlug);
  const memberId = memberQ.data?.id;

  const campaignsQ = useCampaigns(tenantSlug);
  const campaigns = campaignsQ.data?.items ?? [];

  const pledgesQ = usePledges(tenantSlug, { memberId }, Boolean(memberId));
  const pledges = pledgesQ.data?.items ?? [];

  // Build pledge lookup: campaignId → member's pledges
  const pledgeByCampaign: Record<string, typeof pledges> = {};
  for (const p of pledges) {
    if (!pledgeByCampaign[p.campaignId]) pledgeByCampaign[p.campaignId] = [];
    pledgeByCampaign[p.campaignId].push(p);
  }

  // Separate active vs past
  const activeCampaigns = campaigns.filter(
    (c) => c.status === "ACTIVE" || c.status === "DRAFT",
  );
  const pastCampaigns = campaigns.filter(
    (c) => c.status === "COMPLETED" || c.status === "CANCELLED",
  );

  const loading = campaignsQ.isLoading;

  return (
    <div style={{ height: "100%", overflow: "auto", paddingRight: 8 }}>
      <PageHeader
        overline="Campaigns"
        title="Church campaigns"
        subtitle="Browse active fundraising campaigns, view progress, and make pledges."
      />

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <div
                style={{
                  height: 20,
                  width: 180,
                  background: S.surfaceContainer,
                  borderRadius: 4,
                  marginBottom: 12,
                }}
              />
              <div
                style={{
                  height: 14,
                  width: 260,
                  background: S.surfaceContainer,
                  borderRadius: 4,
                  marginBottom: 16,
                }}
              />
              <div
                style={{
                  height: 6,
                  background: S.surfaceContainer,
                  borderRadius: 3,
                  marginBottom: 8,
                }}
              />
              <div
                style={{
                  height: 12,
                  width: 100,
                  background: S.surfaceContainer,
                  borderRadius: 4,
                }}
              />
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: S.onSurface,
                marginBottom: 4,
              }}
            >
              No campaigns yet
            </div>
            <div style={{ fontSize: 14, color: S.onSurfaceMuted }}>
              Your church hasn&apos;t started any campaigns. Check back later!
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* Active campaigns */}
          {activeCampaigns.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: S.onSurfaceMuted,
                  marginBottom: 12,
                }}
              >
                Active campaigns
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                {activeCampaigns.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    myPledges={pledgeByCampaign[c.id] ?? []}
                    tenantSlug={tenantSlug}
                    memberId={memberId}
                    currency={currency}
                    currencySymbol={currencySymbol}
                    onPledge={open}
                  />
                ))}
              </div>
            </>
          )}

          {/* Past campaigns */}
          {pastCampaigns.length > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: S.onSurfaceMuted,
                  marginBottom: 12,
                }}
              >
                Past campaigns
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                  marginBottom: 32,
                }}
              >
                {pastCampaigns.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    myPledges={pledgeByCampaign[c.id] ?? []}
                    tenantSlug={tenantSlug}
                    memberId={memberId}
                    currency={currency}
                    currencySymbol={currencySymbol}
                    onPledge={open}
                    past
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Campaign Card with inline progress ─── */

const CampaignCard = ({
  campaign: c,
  myPledges,
  tenantSlug,
  memberId,
  currency,
  currencySymbol,
  onPledge,
  past,
}: {
  campaign: Campaign;
  myPledges: components["schemas"]["PledgeResponseDto"][];
  tenantSlug: string;
  memberId?: string;
  currency: string;
  currencySymbol: string;
  onPledge: (name: "member-pledge", props: MemberPledgeProps) => void;
  past?: boolean;
}) => {
  const progressQ = useCampaignProgress(tenantSlug, c.id, Boolean(c.id));
  const progress = progressQ.data;
  const goal = Number(progress?.goalAmount ?? 0);
  const raised = Number(progress?.raisedAmount ?? 0);
  const pledged = Number(progress?.pledgedAmount ?? 0);
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  const items = progress?.items ?? [];
  const description = nstr(c.description);
  const deadline = nstr(c.deadline);

  const myPledgeTotal = myPledges.reduce(
    (s, p) => s + Number(p.pledgedAmount),
    0,
  );
  const myActivePledges = myPledges.filter((p) => p.status === "ACTIVE");

  return (
    <Card style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: S.onSurface,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {c.title}
        </h3>
        <StatusBadge status={STATUS_MAP[c.status]} />
      </div>

      {/* Description — always 2 lines reserved */}
      <div
        style={{
          fontSize: 13,
          color: S.onSurfaceVariant,
          lineHeight: 1.5,
          marginBottom: 14,
          minHeight: "2.8em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description || "\u00A0"}
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: S.surfaceContainerLow,
            overflow: "hidden",
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: goal > 0 ? `${pct}%` : "0%",
              height: "100%",
              borderRadius: 4,
              background: past
                ? S.onSurfaceMuted
                : `linear-gradient(90deg, ${S.primaryContainer}, ${S.primary})`,
              transition: "width 0.6s ease-out",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: S.onSurfaceMuted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span>
            {currencySymbol}{fmtCompact(raised)} raised
            {pledged > 0 && ` · ${currencySymbol}${fmtCompact(pledged)} pledged`}
          </span>
          <span>
            {goal > 0 ? `Goal: ${currencySymbol}${fmtCompact(goal)}` : "No goal set"}
          </span>
        </div>
      </div>

      {/* Items breakdown */}
      {items.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: S.onSurfaceMuted,
              marginBottom: 8,
            }}
          >
            Campaign items
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((item) => {
              const itemPct =
                Number(item.targetAmount) > 0
                  ? Math.min(
                      (Number(item.raisedAmount) / Number(item.targetAmount)) * 100,
                      100,
                    )
                  : 0;
              return (
                <div
                  key={item.itemId}
                  style={{ display: "flex", alignItems: "center", gap: 10 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        marginBottom: 3,
                      }}
                    >
                      <span style={{ color: S.onSurface, fontWeight: 500 }}>
                        {item.title}
                      </span>
                      <span
                        style={{
                          color: S.onSurfaceMuted,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {currencySymbol}{fmtCompact(Number(item.raisedAmount))} /{" "}
                        {currencySymbol}{fmtCompact(Number(item.targetAmount))}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        borderRadius: 2,
                        background: S.surfaceContainerLow,
                      }}
                    >
                      <div
                        style={{
                          width: `${itemPct}%`,
                          height: "100%",
                          borderRadius: 2,
                          background: S.primary,
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spacer pushes badges & button to bottom */}
      <div style={{ flex: 1 }} />

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: S.surfaceContainer,
          margin: "0 -24px 14px",
          width: "calc(100% + 48px)",
        }}
      />

      {/* Badges row */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {myActivePledges.length > 0 ? (
          <Badge color="indigo">
            Your pledge: {currencySymbol}{fmtCurrency(myPledgeTotal)}
          </Badge>
        ) : (
          !past && <Badge color="neutral">No pledge yet</Badge>
        )}
        {deadline && (
          <Badge color="gray">
            {past ? "Ended" : "Ends"}{" "}
            {new Date(deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Badge>
        )}
        {progress && (
          <Badge color="gray">
            {progress.pledgeCount} pledge{progress.pledgeCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {/* Action button */}
      {!past && memberId && (
        <Button
          onClick={() =>
            onPledge("member-pledge", {
              tenantSlug,
              campaignId: c.id,
              campaignTitle: c.title,
              currency,
              memberId,
              items: items.map((i) => ({
                id: i.itemId,
                tenantId: c.tenantId,
                campaignId: c.id,
                title: i.title,
                targetAmount: i.targetAmount,
                sortOrder: 0,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
              })),
            })
          }
          style={{ width: "100%" }}
        >
          {myActivePledges.length > 0 ? "Add another pledge" : "Make a pledge"}
        </Button>
      )}
    </Card>
  );
}
