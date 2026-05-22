"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { Button, PageHeader } from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import { useAuth } from "@/lib/auth/AuthProvider";
import dayjs from "@/lib/dayjs";
import { openModal } from "@/lib/modals/store";
import { daysUntil, num } from "../admin-shared";
import { DashboardRecentGifts } from "./DashboardRecentGifts";
import { DeadlineWatchCard } from "./DeadlineWatchCard";
import { NowSnapshotStrip } from "./NowSnapshotStrip";
import { OutstandingPledgesCard } from "./OutstandingPledgesCard";
import { UnattributedCallout } from "./UnattributedCallout";
import { useCampaignProgressMany } from "./useCampaignProgressMany";
import { useCampaignsManyWithItems } from "./useCampaignsManyWithItems";

type Campaign = components["schemas"]["CampaignResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

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

	const weekTransactions = useTransactions(tenantSlug, {
		dateFrom: weekFrom,
		dateTo: weekTo,
		limit: 500,
	});

	const recentTx = useTransactions(tenantSlug, { limit: 6 });
	const membersQ = useMembers(tenantSlug, { limit: 200 });
	const campaignsQ = useCampaigns(tenantSlug);
	const activePledgesQ = usePledges(tenantSlug, {
		status: "ACTIVE",
		limit: 200,
	});

	const members: Member[] = useMemo(
		() => membersQ.data?.items ?? [],
		[membersQ.data],
	);
	const campaigns: Campaign[] = useMemo(
		() => campaignsQ.data?.items ?? [],
		[campaignsQ.data],
	);
	const pledges = useMemo(
		() => activePledgesQ.data?.items ?? [],
		[activePledgesQ.data],
	);

	const membersById = useMemo(
		() => Object.fromEntries(members.map((m) => [m.id, m])),
		[members],
	);
	const campaignsById = useMemo(
		() => Object.fromEntries(campaigns.map((c) => [c.id, c])),
		[campaigns],
	);

	// Fan-out campaign progress for active, deadlined campaigns only.
	const deadlinedCampaignIds = useMemo(
		() =>
			campaigns
				.filter((c) => c.status === "ACTIVE" && typeof c.deadline === "string")
				.map((c) => c.id),
		[campaigns],
	);
	const { progressById } = useCampaignProgressMany(
		tenantSlug,
		deadlinedCampaignIds,
	);

	// Item deadlines for the campaigns referenced by active pledges —
	// `resolvePledgeDeadline` needs them to compute lifecycle correctly
	// (item deadline takes precedence over campaign deadline).
	const pledgeCampaignIds = useMemo(() => {
		const set = new Set<string>();
		for (const p of pledges) {
			if (p.campaignId) {
				set.add(p.campaignId);
			}
		}
		return Array.from(set);
	}, [pledges]);
	const { itemDeadlinesById } = useCampaignsManyWithItems(
		tenantSlug,
		pledgeCampaignIds,
	);

	// Unattributed counts — derived from this week's transactions.
	const { anonCount, anonTotal, noCampCount, noCampTotal } = useMemo(() => {
		let aC = 0;
		let aT = 0;
		let nC = 0;
		let nT = 0;
		for (const t of weekTransactions.data?.items ?? []) {
			const amt = num(t.amount);
			if (!t.memberId) {
				aC += 1;
				aT += amt;
			}
			if (!t.campaignId) {
				nC += 1;
				nT += amt;
			}
		}
		return { anonCount: aC, anonTotal: aT, noCampCount: nC, noCampTotal: nT };
	}, [weekTransactions.data]);

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

	const newMembersThisWeek = useMemo(
		() =>
			members.filter((m) => dayjs(m.createdAt).isAfter(dayjs().startOf("week")))
				.length,
		[members],
	);

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
					memberCount={membersQ.data?.meta?.total ?? members.length}
					newMembersThisWeek={newMembersThisWeek}
					activeCampaigns={activeCampaignCount}
					deadlineSoonCount={deadlineSoonCount}
					loading={weekSummary.isLoading || priorWeekSummary.isLoading}
				/>

				<UnattributedCallout
					anonymousCount={anonCount}
					anonymousTotal={anonTotal}
					noCampaignCount={noCampCount}
					noCampaignTotal={noCampTotal}
					tenantSlug={tenantSlug}
				/>

				<div className="mb-6 grid gap-4 lg:grid-cols-2">
					<OutstandingPledgesCard
						pledges={pledges}
						campaignsById={campaignsById}
						membersById={membersById}
						itemDeadlinesById={itemDeadlinesById}
						tenantSlug={tenantSlug}
						loading={
							activePledgesQ.isLoading ||
							campaignsQ.isLoading ||
							membersQ.isLoading
						}
					/>
					<DeadlineWatchCard
						campaigns={campaigns}
						progressById={progressById}
						tenantSlug={tenantSlug}
						loading={campaignsQ.isLoading}
					/>
				</div>

				<DashboardRecentGifts
					transactions={recentTx.data?.items ?? []}
					membersById={membersById}
					campaignsById={campaignsById}
					loading={recentTx.isLoading}
					tenantSlug={tenantSlug}
				/>
			</div>
		</div>
	);
};
