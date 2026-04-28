"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/primitives";
import { useMyMembership } from "@/lib/api/members";
import { useTransactions } from "@/lib/api/transactions";
import { useCampaigns, useCampaignProgress } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";
import { useTenant } from "@/lib/api/tenants";
import { MemberKpiStrip } from "./MemberKpiStrip";
import { MemberRecentGiving } from "./MemberRecentGiving";
import { MemberCampaignsPledges } from "./MemberCampaignsPledges";
import { MemberThankYou } from "./MemberThankYou";

export const MemberDashboardPage = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  // Tenant info for currency
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

  // Current member
  const memberQ = useMyMembership(tenantSlug);
  const memberId = memberQ.data?.id;
  const firstName = memberQ.data?.firstName ?? "there";

  // Member's transactions (scoped by memberId)
  const txQ = useTransactions(
    tenantSlug,
    { memberId, limit: 500 },
    Boolean(memberId),
  );
  const transactions = txQ.data?.items ?? [];

  // Active campaigns
  const campaignsQ = useCampaigns(tenantSlug);
  const campaigns = campaignsQ.data?.items ?? [];
  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");

  // Campaign progress for active campaigns
  // We fetch progress for the first few active campaigns
  const firstCampaignId = activeCampaigns[0]?.id ?? "";
  const secondCampaignId = activeCampaigns[1]?.id ?? "";
  const thirdCampaignId = activeCampaigns[2]?.id ?? "";

  const progress1 = useCampaignProgress(
    tenantSlug,
    firstCampaignId,
    Boolean(firstCampaignId),
  );
  const progress2 = useCampaignProgress(
    tenantSlug,
    secondCampaignId,
    Boolean(secondCampaignId),
  );
  const progress3 = useCampaignProgress(
    tenantSlug,
    thirdCampaignId,
    Boolean(thirdCampaignId),
  );

  const progressMap: Record<
    string,
    { goalAmount: number; raisedAmount: number; pledgedAmount: number }
  > = {};
  if (progress1.data && firstCampaignId) {
    progressMap[firstCampaignId] = {
      goalAmount: progress1.data.goalAmount ?? 0,
      raisedAmount: progress1.data.raisedAmount ?? 0,
      pledgedAmount: progress1.data.pledgedAmount ?? 0,
    };
  }
  if (progress2.data && secondCampaignId) {
    progressMap[secondCampaignId] = {
      goalAmount: progress2.data.goalAmount ?? 0,
      raisedAmount: progress2.data.raisedAmount ?? 0,
      pledgedAmount: progress2.data.pledgedAmount ?? 0,
    };
  }
  if (progress3.data && thirdCampaignId) {
    progressMap[thirdCampaignId] = {
      goalAmount: progress3.data.goalAmount ?? 0,
      raisedAmount: progress3.data.raisedAmount ?? 0,
      pledgedAmount: progress3.data.pledgedAmount ?? 0,
    };
  }

  // Member's pledges
  const pledgesQ = usePledges(tenantSlug, { memberId }, Boolean(memberId));
  const pledges = pledgesQ.data?.items ?? [];

  const loading = memberQ.isLoading || txQ.isLoading;

  return (
    <div className="h-full overflow-auto pr-2">
      <PageHeader
        overline="Welcome"
        title={`Hello, ${firstName}`}
        subtitle={`Here's a gentle summary of your giving and campaigns at ${tenantQ.data?.name ?? "your church"}.`}
      />

      {/* Row 1: KPI strip */}
      <MemberKpiStrip
        transactions={transactions}
        loading={loading}
        currency={currencySymbol}
      />

      {/* Row 2: Recent giving + Campaigns & Pledges */}
      <div className="mb-6 grid grid-cols-[1.5fr_1fr] gap-4">
        <MemberRecentGiving
          transactions={transactions}
          loading={loading}
          tenantSlug={tenantSlug}
        />
        <MemberCampaignsPledges
          campaigns={campaigns}
          pledges={pledges}
          progressMap={progressMap}
          loading={campaignsQ.isLoading}
          tenantSlug={tenantSlug}
          memberId={memberId}
        />
      </div>

      {/* Row 3: Thank-you banner */}
      {!loading && transactions.length > 0 && (
        <MemberThankYou name={firstName} />
      )}
    </div>
  );
};
