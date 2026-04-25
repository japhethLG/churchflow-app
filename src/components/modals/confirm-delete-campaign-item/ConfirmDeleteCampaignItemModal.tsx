"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useDeleteCampaignItem } from "@/lib/api/campaigns";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete-campaign-item": ConfirmDeleteCampaignItemProps;
  }
}

export type ConfirmDeleteCampaignItemProps = {
  tenantSlug: string;
  campaignId: string;
  itemId: string;
  itemTitle: string;
};

export function ConfirmDeleteCampaignItemModal({
  tenantSlug,
  campaignId,
  itemId,
  itemTitle,
  onClose,
}: ConfirmDeleteCampaignItemProps & ModalBaseProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useDeleteCampaignItem(tenantSlug);

  async function handleDelete() {
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId: tenantSlug, id: campaignId, itemId } } });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    }
  }

  return (
    <BaseModal
      title={`Remove "${itemTitle}"?`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Remove item", onClick: handleDelete, loading: isPending, destructive: true }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        Removes this line item from the campaign. The campaign goal drops by this item&apos;s target. Pledges that
        targeted this item specifically will become campaign-wide pledges.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
