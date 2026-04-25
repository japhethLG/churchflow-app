"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader, Button, Chip } from "@/components/primitives";
import {
  ReportsByType,
  ReportsByMonth,
  ReportsByMember,
  ReportsByCampaign,
} from "@/components/pages/reports";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { SANCTUARY as S } from "@/lib/design/tokens";
import type { components } from "@/lib/api";

type Tab = "by-type" | "by-member" | "by-campaign" | "by-month";

type Campaign = components["schemas"]["CampaignResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

const TABS: { key: Tab; label: string }[] = [
  { key: "by-type", label: "By Type" },
  { key: "by-member", label: "By Member" },
  { key: "by-campaign", label: "By Campaign" },
  { key: "by-month", label: "By Month" },
];

export default function ReportsPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [tab, setTab] = useState<Tab>("by-type");

  // Fetch YTD summary (up to 12 months)
  const ytdMonths = new Date().getUTCMonth() + 1;
  const summary = useTransactionSummary(tenantSlug, 12);

  // For By Member and By Campaign tabs, we need raw transactions
  const txQuery = useTransactions(
    tenantSlug,
    { limit: 500 },
    tab === "by-member" || tab === "by-campaign",
  );
  const membersQ = useMembers(tenantSlug, { limit: 500 }, tab === "by-member");
  const campaignsQ = useCampaigns(tenantSlug, tab === "by-campaign");

  const members: Member[] = membersQ.data?.items ?? [];
  const campaigns: Campaign[] = campaignsQ.data?.items ?? [];
  const membersById: Record<string, Member> = Object.fromEntries(
    members.map((m) => [m.id, m]),
  );
  const campaignsById: Record<string, Campaign> = Object.fromEntries(
    campaigns.map((c) => [c.id, c]),
  );

  const currency = summary.data?.currency ?? "USD";

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="Insights"
        title="Reports"
        subtitle="Income insights across members, types, campaigns, and time."
        action={
          <Button variant="secondary" icon="download" disabled>
            Export CSV
          </Button>
        }
      />

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 20,
          background: S.surfaceContainerLow,
          padding: 4,
          borderRadius: 9999,
          width: "fit-content",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 18px",
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 500,
              background:
                tab === t.key ? S.surfaceContainerLowest : "transparent",
              color: tab === t.key ? S.onSurface : S.onSurfaceMuted,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
              transition: "all 0.15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Date range chips */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <Chip icon="calendar">
          Jan 1 —{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          , {new Date().getFullYear()}
        </Chip>
        <Chip>{currency}</Chip>
      </div>

      {/* Tab content */}
      {tab === "by-type" && (
        <>
          <ReportsByType summary={summary.data} loading={summary.isLoading} />
          <ReportsByMonth summary={summary.data} loading={summary.isLoading} />
        </>
      )}

      {tab === "by-member" && (
        <ReportsByMember
          transactions={txQuery.data?.items ?? []}
          membersById={membersById}
          currency={currency}
          loading={txQuery.isLoading || membersQ.isLoading}
        />
      )}

      {tab === "by-campaign" && (
        <ReportsByCampaign
          transactions={txQuery.data?.items ?? []}
          campaignsById={campaignsById}
          currency={currency}
          loading={txQuery.isLoading || campaignsQ.isLoading}
        />
      )}

      {tab === "by-month" && (
        <ReportsByMonth summary={summary.data} loading={summary.isLoading} />
      )}
    </div>
  );
}
