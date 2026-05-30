"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { PageHeader } from "@/components/primitives";
import type { components } from "@/lib/api";
import {
	useMyCampaigns,
	useMyCampaignsProgressBatch,
} from "@/lib/api/campaigns";
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
	const progressBatchQ = useMyCampaignsProgressBatch(
		tenantSlug,
		deadlinedActiveIds,
	);
	const progressById = useMemo(() => {
		const map: Record<
			string,
			{ goalAmount: number; pledgedAmount: number; raisedAmount: number }
		> = {};
		for (const e of progressBatchQ.data?.items ?? []) {
			map[e.campaignId] = {
				goalAmount: e.goalAmount,
				pledgedAmount: e.pledgedAmount,
				raisedAmount: e.raisedAmount,
			};
		}
		return map;
	}, [progressBatchQ.data]);

	// Active pledges for the OutstandingPledges card. Each pledge carries its
	// resolved deadline / lifecycle / campaign snapshot, so no per-campaign
	// item-deadline fan-out is needed.
	const pledgesQ = useMyPledges(tenantSlug, { status: "ACTIVE" });
	const pledges = pledgesQ.data?.items ?? [];

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
						tenantSlug={tenantSlug}
						loading={pledgesQ.isLoading}
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
