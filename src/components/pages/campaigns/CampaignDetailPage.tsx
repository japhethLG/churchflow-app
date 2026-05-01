"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import { CampaignHero } from "./CampaignHero";
import { CampaignProgressCard } from "./CampaignProgressCard";
import { CampaignItemsList } from "./CampaignItemsList";
import { CampaignPledgesList } from "./CampaignPledgesList";
import { useCampaign, useCampaignProgress } from "@/lib/api/campaigns";
import { openModal } from "@/lib/modals/store";
import type { components } from "@/lib/api";

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
      <div className="p-6">
        <div className="mb-6 h-[200px] rounded-[20px] bg-secondary" />
        <div className="h-60 rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="bg-background px-10 py-10 text-center text-muted-foreground">
        <p className="mb-1 text-base font-medium text-foreground">Campaign not found</p>
        <p className="text-sm">It may have been deleted.</p>
        <div className="mt-4">
          <Button variant="secondary" onClick={() => router.push(`/${tenantSlug}/admin/campaigns`)}>
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
    openModal("edit-campaign-item", { tenantSlug, campaignId: campaign.id, item });
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
    <div className="h-full overflow-auto">
      <PageHeader
        overline="Fundraising / Campaigns"
        title={campaign.title}
        subtitle="Goal, items, and pledges for this campaign."
        action={
          <>
            <Button variant="secondary" onClick={() => router.push(`/${tenantSlug}/admin/campaigns`)}>
              Back
            </Button>
            <Button
              variant="secondary"
              icon="edit"
              onClick={() => router.push(`/${tenantSlug}/admin/campaigns/${id}/edit`)}
            >
              Edit
            </Button>
            {canCancel && (
              <Button variant="tertiary" onClick={askCancel}>
                Cancel campaign
              </Button>
            )}
            <Button variant="tertiary" destructive icon="trash" onClick={askDelete}>
              Delete
            </Button>
          </>
        }
      />

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
  );
}
