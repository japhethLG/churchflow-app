"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Button, PageHeader } from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns, useCampaignsProgressBatch } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useUrgentPledges } from "@/lib/api/pledges";
import {
	useTransactionSummary,
	useTransactions,
	useUnattributedSummary,
} from "@/lib/api/transactions";
import { useAuth } from "@/lib/auth/AuthProvider";
import dayjs from "@/lib/dayjs";
import { openModal } from "@/lib/modals/store";
import { daysUntil } from "../admin-shared";
import { DashboardRecentGifts } from "./DashboardRecentGifts";
import { DeadlineWatchCard } from "./DeadlineWatchCard";
import { NowSnapshotStrip } from "./NowSnapshotStrip";
import { OutstandingPledgesCard } from "./OutstandingPledgesCard";
import { UnattributedCallout } from "./UnattributedCallout";

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

	const weekFrom = dayjs().startOf("week").toISOString();
	const weekTo = dayjs().endOf("week").toISOString();
	const priorWeekFrom = dayjs()
		.subtract(1, "week")
		.startOf("week")
		.toISOString();
	const priorWeekTo = dayjs().subtract(1, "week").endOf("week").toISOString();

	const weekSummary = useTransactionSummary(tenantSlug, {
		dateFrom: weekFrom,
		dateTo: weekTo,
	});
	const priorWeekSummary = useTransactionSummary(tenantSlug, {
		dateFrom: priorWeekFrom,
		dateTo: priorWeekTo,
	});

	// Server-aggregated callout — replaces the previous limit-500 fetch + JS
	// count, which silently truncated for high-traffic weeks.
	const unattributedQ = useUnattributedSummary(tenantSlug, {
		dateFrom: weekFrom,
		dateTo: weekTo,
	});

	// Recent gifts come with embedded member/campaign relations, so we no
	// longer prefetch the full member/campaign roster just to render row
	// labels.
	const recentTx = useTransactions(tenantSlug, { limit: 6 });

	const campaignsQ = useCampaigns(tenantSlug);
	const campaigns: Campaign[] = useMemo(
		() => campaignsQ.data?.items ?? [],
		[campaignsQ.data],
	);

	// Active campaigns near deadline → batch progress in one roundtrip.
	const deadlinedCampaignIds = useMemo(
		() =>
			campaigns
				.filter((c) => {
					if (c.status !== "ACTIVE" || typeof c.deadline !== "string") {
						return false;
					}
					const d = daysUntil(c.deadline);
					return d !== null && d <= 30;
				})
				.sort((a, b) => {
					const ad = daysUntil(a.deadline as unknown as string) ?? 0;
					const bd = daysUntil(b.deadline as unknown as string) ?? 0;
					return ad - bd;
				})
				.slice(0, 5)
				.map((c) => c.id),
		[campaigns],
	);
	const progressBatchQ = useCampaignsProgressBatch(
		tenantSlug,
		deadlinedCampaignIds,
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

	// Urgent pledges — BE computes lifecycle + resolved deadline and sorts
	// by urgency. No more fan-out of campaign-item lookups on the FE.
	const urgentPledgesQ = useUrgentPledges(tenantSlug, { limit: 8 });

	const activeCampaignCount = campaigns.filter(
		(c) => c.status === "ACTIVE",
	).length;
	const deadlineSoonCount = useMemo(
		() =>
			campaigns.filter((c) => {
				if (c.status !== "ACTIVE" || typeof c.deadline !== "string") {
					return false;
				}
				const d = daysUntil(c.deadline);
				return d !== null && d >= 0 && d <= 14;
			}).length,
		[campaigns],
	);

	// Total member count + new-this-week numbers from the existing list
	// endpoint. `limit: 1` so we only fetch a single row — we just need
	// `meta.total` from each response.
	const totalMembersQ = useMembers(tenantSlug, { limit: 1 });
	const newMembersThisWeekQ = useMembers(tenantSlug, {
		limit: 1,
		dateFrom: weekFrom,
		dateTo: weekTo,
	});
	const totalMembers = totalMembersQ.data?.meta.total ?? 0;
	const newMembersThisWeek = newMembersThisWeekQ.data?.meta.total ?? 0;

	const firstName = user?.displayName?.split(" ")[0] ?? "Admin";

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline={`Act · ${dayjs().format("dddd, MMMM D")}`}
				title={`${getGreeting()}, ${firstName}`}
				subtitle="What needs your attention this week."
				action={
					<Button
						role="primary"
						icon="plus"
						onClick={() => openModal("record-gift", { tenantSlug })}
					>
						Record a gift
					</Button>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<NowSnapshotStrip
					weekSummary={weekSummary.data}
					priorWeekSummary={priorWeekSummary.data}
					memberCount={totalMembers}
					newMembersThisWeek={newMembersThisWeek}
					activeCampaigns={activeCampaignCount}
					deadlineSoonCount={deadlineSoonCount}
					loading={weekSummary.isLoading || priorWeekSummary.isLoading}
				/>

				<UnattributedCallout
					summary={unattributedQ.data}
					tenantSlug={tenantSlug}
				/>

				<div className="mb-6 grid gap-4 lg:grid-cols-2">
					<OutstandingPledgesCard
						pledges={urgentPledgesQ.data?.items ?? []}
						tenantSlug={tenantSlug}
						loading={urgentPledgesQ.isLoading}
					/>
					<DeadlineWatchCard
						campaigns={campaigns}
						progressById={progressById}
						tenantSlug={tenantSlug}
						loading={campaignsQ.isLoading || progressBatchQ.isLoading}
					/>
				</div>

				<DashboardRecentGifts
					transactions={recentTx.data?.items ?? []}
					loading={recentTx.isLoading}
					tenantSlug={tenantSlug}
				/>
			</div>
		</div>
	);
};
