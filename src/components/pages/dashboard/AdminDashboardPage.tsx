"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Button, PageHeader } from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import { useAuth } from "@/lib/auth/AuthProvider";
import dayjs from "@/lib/dayjs";
import { openModal } from "@/lib/modals/store";
import { DashboardActiveCampaigns } from "./DashboardActiveCampaigns";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardKpiStrip } from "./DashboardKpiStrip";
import { DashboardRecentGifts } from "./DashboardRecentGifts";

type Campaign = components["schemas"]["CampaignResponseDto"];

const getGreeting = (): string => {
	const h = dayjs().hour();
	if (h < 12) {
		return "Good morning";
	}
	if (h < 17) {
		return "Good afternoon";
	}
	return "Good evening";
};

export const AdminDashboardPage = () => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const { user } = useAuth();

	const [chartMonths, setChartMonths] = useState(12);

	// Data hooks
	const currentMonthSummary = useTransactionSummary(tenantSlug, 1);
	const previousMonthSummary = useTransactionSummary(tenantSlug, 2);
	const chartSummary = useTransactionSummary(tenantSlug, chartMonths);
	const recentTx = useTransactions(tenantSlug, { limit: 6 });
	const membersQ = useMembers(tenantSlug, { limit: 200 });
	const campaignsQ = useCampaigns(tenantSlug);

	const members = membersQ.data?.items ?? [];
	const campaigns: Campaign[] = campaignsQ.data?.items ?? [];
	const membersById: Record<string, (typeof members)[number]> =
		Object.fromEntries(members.map((m) => [m.id, m]));

	// Active campaigns for the campaigns widget
	const activeCampaigns = campaigns.filter(
		(c) => c.status === "ACTIVE" || c.status === "DRAFT",
	);

	// Member stats
	const memberCount = membersQ.data?.meta?.total ?? members.length;

	// Campaign progress — fetch progress for each active campaign
	// We'll use a simple approach: get progress for first 5 active campaigns
	const progressMap: Record<
		string,
		{ goalAmount: number; raisedAmount: number; pledgedAmount: number }
	> = {};

	const firstName = user?.displayName?.split(" ")[0] ?? "Admin";

	return (
		<div className="h-full overflow-auto pr-2">
			<PageHeader
				overline={`Overview · ${dayjs().format("MMMM YYYY")}`}
				title={`${getGreeting()}, ${firstName}`}
				subtitle={`Here's how giving is trending at your church.`}
				action={
					<Button
						variant="primary"
						icon="plus"
						onClick={() => openModal("record-gift", { tenantSlug })}
					>
						Record a gift
					</Button>
				}
			/>

			{/* KPI strip */}
			<DashboardKpiStrip
				summary={currentMonthSummary.data}
				previousSummary={previousMonthSummary.data}
				memberCount={memberCount}
				activeCampaignCount={activeCampaigns.length}
				loading={currentMonthSummary.isLoading}
			/>

			{/* Charts row */}
			<DashboardCharts
				summary={chartSummary.data}
				loading={chartSummary.isLoading}
				months={chartMonths}
				onMonthsChange={setChartMonths}
			/>

			{/* Bottom row: Recent gifts + Active campaigns */}
			<div className="mb-4 grid grid-cols-2 gap-4">
				<DashboardRecentGifts
					transactions={recentTx.data?.items ?? []}
					membersById={membersById}
					loading={recentTx.isLoading}
					tenantSlug={tenantSlug}
				/>
				<DashboardActiveCampaigns
					campaigns={campaigns}
					progressMap={progressMap}
					loading={campaignsQ.isLoading}
					tenantSlug={tenantSlug}
				/>
			</div>
		</div>
	);
};
