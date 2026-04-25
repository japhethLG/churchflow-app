"use client";

import { useParams, useRouter } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Button, PageHeader } from "@/components/primitives";
import {
  CampaignHero,
  CampaignItemsList,
  CampaignPledgesList,
  CampaignProgressCard,
} from "@/components/pages/campaigns";
import { useCampaign, useCampaignProgress } from "@/lib/api/campaigns";
import { openModal } from "@/lib/modals/store";
import type { components } from "@/lib/api";

type Item = components["schemas"]["CampaignItemResponseDto"];
type ItemProgress = components["schemas"]["CampaignItemProgressDto"];
type Pledge = components["schemas"]["PledgeResponseDto"];

export default () => {
  const router = useRouter();
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const { data: campaign, isLoading, error } = useCampaign(tenantSlug, id);
  const { data: progress, isLoading: progressLoading } = useCampaignProgress(
    tenantSlug,
    id,
    Boolean(campaign)
  );

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ height: 200, background: S.surfaceContainer, borderRadius: 20, marginBottom: 24 }} />
        <div style={{ height: 240, background: S.surfaceContainer, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: S.onSurfaceMuted }}>
        <p style={{ fontSize: 16, color: S.onSurface }}>Campaign not found</p>
        <p style={{ fontSize: 13 }}>It may have been deleted.</p>
        <div style={{ marginTop: 16 }}>
          <Button variant="secondary" onClick={() => router.push(`/${tenantSlug}/admin/campaigns`)}>
            Back to campaigns
          </Button>
        </div>
      </div>
    );
  }

  const items: Item[] = campaign.items;
  const progressByItemId: Record<string, ItemProgress> = Object.fromEntries(
    (progress?.items ?? []).map((p) => [p.itemId, p])
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
      currency: campaign.currency,
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
      currency: campaign.currency,
      items,
    });
  const openEditPledge = (pledge: Pledge) =>
    openModal("edit-pledge", { tenantSlug, pledge, currency: campaign.currency });
  const openDeletePledge = (pledge: Pledge) =>
    openModal("confirm-delete-pledge", { tenantSlug, pledgeId: pledge.id });

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
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

      <div style={{ display: "grid", gap: 16 }}>
        <CampaignProgressCard progress={progress} loading={progressLoading} currency={campaign.currency} />

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
