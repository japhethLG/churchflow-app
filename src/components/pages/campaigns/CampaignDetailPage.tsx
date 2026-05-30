"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Badge,
	Button,
	EntityRestoreBanner,
	PageActionsMenu,
	PageHeader,
	SegmentedControl,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaign, useCampaignProgress } from "@/lib/api/campaigns";
import dayjs from "@/lib/dayjs";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";
import { openSheet } from "@/lib/sheets/store";
import { daysUntil } from "../admin-shared";
import { CampaignItemsTab } from "./CampaignItemsTab";
import { CampaignOverviewTab } from "./CampaignOverviewTab";
import { CampaignPledgesTab } from "./CampaignPledgesTab";

type ItemProgress = components["schemas"]["CampaignItemProgressDto"];

type Tab = "overview" | "items" | "pledges";

const TABS = [
	{ value: "overview", label: "Overview" },
	{ value: "items", label: "Line items" },
	{ value: "pledges", label: "Pledges" },
];

const STATUS_BADGE: Record<
	"DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED",
	"neutral" | "green" | "blue" | "red"
> = {
	DRAFT: "neutral",
	ACTIVE: "green",
	COMPLETED: "blue",
	CANCELLED: "red",
};

export const CampaignDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
	const [tab, setTab] = useState<Tab>("overview");

	const {
		data: campaign,
		isLoading,
		error,
	} = useCampaign(tenantSlug, id, { includeDeleted: true });
	const { data: progress } = useCampaignProgress(
		tenantSlug,
		id,
		Boolean(campaign),
	);

	// Mobile FAB — contextual to the active tab. The desktop header keeps the
	// Edit button + kebab; on mobile the bulky Edit button is hidden and its
	// action moves here, joined by the tab's own create action (Add item /
	// Add pledge) so the primary action always matches what's on screen.
	useMobileActions(
		useMemo(() => {
			if (!campaign || campaign.deletedAt) {
				return [];
			}
			const liveItems = campaign.items.filter((it) => !it.deletedAt);
			const acts = [];
			if (tab === "items") {
				acts.push({
					label: "Add line item",
					icon: "plus" as const,
					onClick: () =>
						openModal("add-campaign-item", {
							tenantSlug,
							campaignId: campaign.id,
							defaultSortOrder: liveItems.length,
						}),
				});
			} else if (tab === "pledges") {
				acts.push({
					label: "Add pledge",
					icon: "plus" as const,
					onClick: () =>
						openSheet("pledge", {
							intent: "tenant",
							tenantSlug,
							campaignId: campaign.id,
							campaignTitle: campaign.title,
							items: liveItems,
						}),
				});
			}
			acts.push({
				label: "Edit campaign",
				icon: "edit" as const,
				onClick: () => router.push(`/${tenantSlug}/admin/campaigns/${id}/edit`),
			});
			return acts;
		}, [campaign, tab, tenantSlug, id, router]),
	);

	if (isLoading) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-4 pt-5 md:px-8 md:pt-0"
					back={{ href: `/${tenantSlug}/admin/campaigns`, label: "Campaigns" }}
					title="Loading…"
					subtitle="Fetching campaign details…"
				/>
				<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
					<div className="h-60 rounded-2xl bg-secondary animate-pulse" />
				</div>
			</div>
		);
	}

	if (error || !campaign) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-4 pt-5 md:px-8 md:pt-0"
					back={{ href: `/${tenantSlug}/admin/campaigns`, label: "Campaigns" }}
					title="Not found"
					subtitle="This campaign may have been deleted."
				/>
				<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8 text-center text-muted-foreground flex flex-col items-center justify-center">
					<p className="mb-4 text-base font-medium text-foreground">
						Campaign not found
					</p>
					<Button
						role="secondary"
						onClick={() => router.push(`/${tenantSlug}/admin/campaigns`)}
					>
						Back to campaigns
					</Button>
				</div>
			</div>
		);
	}

	const isDeleted = Boolean(campaign.deletedAt);
	const canCancel = campaign.status === "ACTIVE" || campaign.status === "DRAFT";

	const progressByItemId: Record<string, ItemProgress> = Object.fromEntries(
		(progress?.items ?? []).map((p) => [p.itemId, p]),
	);

	const deadlineStr =
		typeof campaign.deadline === "string" ? campaign.deadline : null;
	const days = daysUntil(deadlineStr);
	const deadlineBadge = (() => {
		if (!deadlineStr) {
			return null;
		}
		if (campaign.status !== "ACTIVE") {
			return null;
		}
		if (days === null) {
			return null;
		}
		if (days < 0) {
			return { color: "red" as const, text: `${Math.abs(days)}d past due` };
		}
		if (days <= 14) {
			return { color: "amber" as const, text: `Due in ${days}d` };
		}
		return { color: "neutral" as const, text: `${days}d left` };
	})();

	const subtitle = (
		<span className="inline-flex flex-wrap items-center gap-2">
			<Badge color={STATUS_BADGE[campaign.status]}>{campaign.status}</Badge>
			{deadlineStr ? (
				<>
					<span>Deadline · {dayjs(deadlineStr).format("MMMM D, YYYY")}</span>
					{deadlineBadge && (
						<Badge color={deadlineBadge.color}>{deadlineBadge.text}</Badge>
					)}
				</>
			) : (
				<span>Open-ended · no deadline</span>
			)}
		</span>
	);

	const action = !isDeleted ? (
		<>
			<Button
				role="primary"
				icon="edit"
				onClick={() => router.push(`/${tenantSlug}/admin/campaigns/${id}/edit`)}
				className="hidden md:inline-flex"
			>
				Edit
			</Button>
			<PageActionsMenu
				actions={[
					...(canCancel
						? [
								{
									label: "Cancel campaign",
									onClick: () =>
										openModal("confirm-cancel-campaign", {
											tenantSlug,
											campaignId: campaign.id,
											campaignTitle: campaign.title,
										}),
								},
							]
						: []),
					{
						label: "Delete campaign",
						onClick: () =>
							openModal("confirm-delete-campaign", {
								tenantSlug,
								campaignId: campaign.id,
								campaignTitle: campaign.title,
								onDeleted: () => router.push(`/${tenantSlug}/admin/campaigns`),
							}),
						destructive: true,
						separatorBefore: canCancel,
					},
				]}
			/>
		</>
	) : undefined;

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				back={{ href: `/${tenantSlug}/admin/campaigns`, label: "Campaigns" }}
				title={campaign.title}
				subtitle={subtitle}
				action={action}
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
				{isDeleted && (
					<EntityRestoreBanner
						className="mb-4"
						entityLabel="Campaign"
						deletedAt={campaign.deletedAt}
						onRestore={() =>
							openModal("confirm-restore-campaign", {
								tenantId: tenantSlug,
								campaignId: campaign.id,
								campaignTitle: campaign.title,
							})
						}
					/>
				)}

				<div className="mb-6 -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
					<SegmentedControl
						options={TABS}
						value={tab}
						onChange={(v) => setTab(v as Tab)}
					/>
				</div>

				{tab === "overview" && (
					<CampaignOverviewTab
						campaign={campaign}
						progress={progress}
						tenantSlug={tenantSlug}
					/>
				)}
				{tab === "items" && (
					<CampaignItemsTab
						campaign={campaign}
						progressByItemId={progressByItemId}
						tenantSlug={tenantSlug}
						parentDeleted={isDeleted}
					/>
				)}
				{tab === "pledges" && (
					<CampaignPledgesTab
						campaign={campaign}
						tenantSlug={tenantSlug}
						parentDeleted={isDeleted}
					/>
				)}
			</div>
		</div>
	);
};
