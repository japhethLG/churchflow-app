"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaign, useCampaignProgress } from "@/lib/api/campaigns";
import { openModal } from "@/lib/modals/store";
import { CampaignHero } from "./CampaignHero";
import { CampaignItemsList } from "./CampaignItemsList";
import { CampaignPledgesList } from "./CampaignPledgesList";
import { CampaignProgressCard } from "./CampaignProgressCard";

type Item = components["schemas"]["CampaignItemResponseDto"];
type ItemProgress = components["schemas"]["CampaignItemProgressDto"];
type Pledge = components["schemas"]["PledgeResponseDto"];

export const CampaignDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
	const { data: campaign, isLoading, error } = useCampaign(tenantSlug, id);
	const { data: progress, isLoading: progressLoading } = useCampaignProgress(
		tenantSlug,
		id,
		Boolean(campaign),
	);

	if (isLoading) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					overline="Fundraising / Campaigns"
					title="Loading..."
					subtitle="Fetching campaign details..."
				/>
				<div className="overflow-auto flex-1 px-8 pb-8 flex flex-col gap-4">
					<div className="h-60 rounded-2xl bg-secondary animate-pulse" />
				</div>
			</div>
		);
	}

	if (error || !campaign) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					overline="Fundraising / Campaigns"
					title="Not Found"
					subtitle="This campaign may have been deleted."
				/>
				<div className="overflow-auto flex-1 px-8 pb-8 text-center text-muted-foreground flex flex-col items-center justify-center">
					<p className="mb-4 text-base font-medium text-foreground">
						Campaign not found
					</p>
					<Button
						variant="secondary"
						onClick={() => router.push(`/${tenantSlug}/admin/campaigns`)}
					>
						Back to campaigns
					</Button>
				</div>
			</div>
		);
	}

	const items: Item[] = campaign.items;
	const progressByItemId: Record<string, ItemProgress> = Object.fromEntries(
		(progress?.items ?? []).map((p) => [p.itemId, p]),
	);

	const canCancel = campaign.status === "ACTIVE" || campaign.status === "DRAFT";

	const askCancel = () =>
		openModal("confirm-cancel-campaign", {
			tenantSlug,
			campaignId: campaign.id,
			campaignTitle: campaign.title,
		});
	const askDelete = () =>
		openModal("confirm-delete-campaign", {
			tenantSlug,
			campaignId: campaign.id,
			campaignTitle: campaign.title,
			onDeleted: () => router.push(`/${tenantSlug}/admin/campaigns`),
		});

	const openAddItem = () =>
		openModal("add-campaign-item", {
			tenantSlug,
			campaignId: campaign.id,
			defaultSortOrder: items.length,
		});
	const openEditItem = (item: Item) =>
		openModal("edit-campaign-item", {
			tenantSlug,
			campaignId: campaign.id,
			item,
		});
	const openDeleteItem = (item: Item) =>
		openModal("confirm-delete-campaign-item", {
			tenantSlug,
			campaignId: campaign.id,
			itemId: item.id,
			itemTitle: item.title,
		});

	const openCreatePledge = () =>
		openModal("create-pledge", {
			tenantSlug,
			campaignId: campaign.id,
			campaignTitle: campaign.title,
			items,
		});
	const openEditPledge = (pledge: Pledge) =>
		openModal("edit-pledge", { tenantSlug, pledge });
	const openDeletePledge = (pledge: Pledge) =>
		openModal("confirm-delete-pledge", { tenantSlug, pledgeId: pledge.id });

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Fundraising / Campaigns"
				title={campaign.title}
				subtitle="Goal, items, and pledges for this campaign."
				action={
					<>
						<Button
							variant="secondary"
							onClick={() => router.push(`/${tenantSlug}/admin/campaigns`)}
						>
							Back
						</Button>
						<Button
							variant="secondary"
							icon="edit"
							onClick={() =>
								router.push(`/${tenantSlug}/admin/campaigns/${id}/edit`)
							}
						>
							Edit
						</Button>
						{canCancel && (
							<Button variant="tertiary" onClick={askCancel}>
								Cancel campaign
							</Button>
						)}
						<Button
							variant="tertiary"
							destructive
							icon="trash"
							onClick={askDelete}
						>
							Delete
						</Button>
					</>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<CampaignHero campaign={campaign} />

				<div className="grid gap-4">
					<CampaignProgressCard progress={progress} loading={progressLoading} />

					<CampaignItemsList
						items={items}
						progressByItemId={progressByItemId}
						onAdd={openAddItem}
						onEdit={openEditItem}
						onDelete={openDeleteItem}
					/>

					<CampaignPledgesList
						tenantSlug={tenantSlug}
						campaignId={campaign.id}
						campaignTitle={campaign.title}
						items={items}
						onCreate={openCreatePledge}
						onEdit={openEditPledge}
						onDelete={openDeletePledge}
					/>
				</div>
			</div>
		</div>
	);
};
