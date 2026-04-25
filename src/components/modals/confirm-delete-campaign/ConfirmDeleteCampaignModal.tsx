"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useDeleteCampaign } from "@/lib/api/campaigns";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete-campaign": ConfirmDeleteCampaignProps;
  }
}

export type ConfirmDeleteCampaignProps = {
  tenantSlug: string;
  campaignId: string;
  campaignTitle: string;
  onDeleted?: () => void;
};

export function ConfirmDeleteCampaignModal({
  tenantSlug,
  campaignId,
  campaignTitle,
  onDeleted,
  onClose,
}: ConfirmDeleteCampaignProps & ModalBaseProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useDeleteCampaign(tenantSlug);

  async function handleDelete() {
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId: tenantSlug, id: campaignId } } });
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <BaseModal
      title={`Delete "${campaignTitle}"?`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Delete campaign", onClick: handleDelete, loading: isPending, destructive: true }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        Soft-deletes the campaign and all its items. Existing pledges and gifts attributed to it remain in giving
        history, but no new pledges can be made. To halt without deleting, cancel it instead.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
