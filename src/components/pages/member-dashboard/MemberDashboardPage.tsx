"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/primitives";
import { useMyCampaignProgress, useMyCampaigns } from "@/lib/api/campaigns";
import { useMyProfile } from "@/lib/api/members";
import { useMyPledges } from "@/lib/api/pledges";
import { useMyChurch } from "@/lib/api/tenants";
import { useMyTransactions } from "@/lib/api/transactions";
import { MemberCampaignsPledges } from "./MemberCampaignsPledges";
import { MemberKpiStrip } from "./MemberKpiStrip";
import { MemberRecentGiving } from "./MemberRecentGiving";
import { MemberThankYou } from "./MemberThankYou";

export const MemberDashboardPage = () => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	// Tenant name for greeting (member-perspective read)
	const tenantQ = useMyChurch(tenantSlug);

	// Current member
	const memberQ = useMyProfile(tenantSlug);
	const memberId = memberQ.data?.id;
	const firstName = memberQ.data?.firstName ?? "there";

	// Member's transactions — self-scoped automatically by URL
	const txQ = useMyTransactions(tenantSlug, { limit: 500 });
	const transactions = txQ.data?.items ?? [];

	// Active campaigns (member-visible)
	const campaignsQ = useMyCampaigns(tenantSlug);
	const campaigns = campaignsQ.data?.items ?? [];
	const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");

	// Campaign progress for the first three active campaigns
	const firstCampaignId = activeCampaigns[0]?.id ?? "";
	const secondCampaignId = activeCampaigns[1]?.id ?? "";
	const thirdCampaignId = activeCampaigns[2]?.id ?? "";

	const progress1 = useMyCampaignProgress(
		tenantSlug,
		firstCampaignId,
		Boolean(firstCampaignId),
	);
	const progress2 = useMyCampaignProgress(
		tenantSlug,
		secondCampaignId,
		Boolean(secondCampaignId),
	);
	const progress3 = useMyCampaignProgress(
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

	// Member's pledges — self-scoped automatically by URL
	const pledgesQ = useMyPledges(tenantSlug);
	const pledges = pledgesQ.data?.items ?? [];

	const loading = memberQ.isLoading || txQ.isLoading;

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Welcome"
				title={`Hello, ${firstName}`}
				subtitle={`Here's a gentle summary of your giving and campaigns at ${tenantQ.data?.name ?? "your church"}.`}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				{/* Row 1: KPI strip */}
				<MemberKpiStrip transactions={transactions} loading={loading} />

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
		</div>
	);
};
