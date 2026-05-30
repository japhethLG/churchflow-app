"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PageHeader } from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMyCampaigns } from "@/lib/api/campaigns";
import { useMyProfile } from "@/lib/api/members";
import { useMyPledges } from "@/lib/api/pledges";
import { useMyChurch, useMyChurchSummary } from "@/lib/api/tenants";
import { useMyTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { num } from "../admin-shared";
import { MemberChurchMixCard } from "./MemberChurchMixCard";
import { MemberChurchPulseStrip } from "./MemberChurchPulseStrip";
import { MemberDeadlinesWatchCard } from "./MemberDeadlinesWatchCard";
import { MemberOutstandingPledgesCard } from "./MemberOutstandingPledgesCard";
import { MemberRecentGiving } from "./MemberRecentGiving";
import { useMyCampaignProgressMany } from "./useMyCampaignProgressMany";
import { useMyCampaignsManyWithItems } from "./useMyCampaignsManyWithItems";

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

export const MemberDashboardPage = () => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const tenantQ = useMyChurch(tenantSlug);
	const summaryQ = useMyChurchSummary(tenantSlug);

	const memberQ = useMyProfile(tenantSlug);
	const firstName = memberQ.data?.firstName ?? "there";

	// Caller's transactions — used for "your giving this year" + Recent
	// giving table. Self-scoped automatically by URL prefix.
	const txQ = useMyTransactions(tenantSlug, { limit: 500 });
	const transactions = txQ.data?.items ?? [];

	const myYearTotal = useMemo(() => {
		const yearStart = dayjs().startOf("year");
		return transactions
			.filter((t) => dayjs(t.date).isSameOrAfter(yearStart))
			.reduce((s, t) => s + num(t.amount), 0);
	}, [transactions]);

	// Campaigns — used by DeadlinesWatch + lookup for Recent giving.
	// includeDeleted so a deleted-campaign reference renders Mode-B.
	const campaignsQ = useMyCampaigns(tenantSlug, { includeDeleted: true });
	const campaigns: Campaign[] = campaignsQ.data?.items ?? [];
	const campaignsById = useMemo(
		() => Object.fromEntries(campaigns.map((c) => [c.id, c])),
		[campaigns],
	);

	// Active + deadlined campaigns → batch their progress for the
	// DeadlinesWatch card.
	const deadlinedActiveIds = useMemo(
		() =>
			campaigns
				.filter((c) => c.status === "ACTIVE" && typeof c.deadline === "string")
				.map((c) => c.id),
		[campaigns],
	);
	const { progressById } = useMyCampaignProgressMany(
		tenantSlug,
		deadlinedActiveIds,
	);

	// Pledges + per-campaign item deadlines for the OutstandingPledges
	// card. Filtering to ACTIVE here keeps the fan-out lean.
	const pledgesQ = useMyPledges(tenantSlug, { status: "ACTIVE" });
	const pledges = pledgesQ.data?.items ?? [];
	const pledgeCampaignIds = useMemo(() => {
		const set = new Set<string>();
		for (const p of pledges) {
			if (p.campaignId) {
				set.add(p.campaignId);
			}
		}
		return Array.from(set);
	}, [pledges]);
	const { itemDeadlinesById } = useMyCampaignsManyWithItems(
		tenantSlug,
		pledgeCampaignIds,
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline={`Orient · ${dayjs().format("dddd, MMMM D")}`}
				title={`${getGreeting()}, ${firstName}`}
				subtitle={`Here's how things are at ${tenantQ.data?.name ?? "your church"} and where you stand.`}
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
				<MemberChurchPulseStrip
					summary={summaryQ.data}
					myYearTotal={myYearTotal}
					loading={summaryQ.isLoading || txQ.isLoading}
				/>

				<div className="mb-6">
					<MemberChurchMixCard
						summary={summaryQ.data}
						loading={summaryQ.isLoading}
					/>
				</div>

				<div className="mb-6 grid gap-4 lg:grid-cols-2">
					<MemberOutstandingPledgesCard
						pledges={pledges}
						campaignsById={campaignsById}
						itemDeadlinesById={itemDeadlinesById}
						tenantSlug={tenantSlug}
						loading={pledgesQ.isLoading || campaignsQ.isLoading}
					/>
					<MemberDeadlinesWatchCard
						campaigns={campaigns}
						progressById={progressById}
						tenantSlug={tenantSlug}
						loading={campaignsQ.isLoading}
					/>
				</div>

				<MemberRecentGiving
					transactions={transactions}
					campaignsById={campaignsById}
					loading={txQ.isLoading}
					tenantSlug={tenantSlug}
				/>
			</div>
		</div>
	);
};
