"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useUpdateCampaign } from "@/lib/api/campaigns";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-cancel-campaign": ConfirmCancelCampaignProps;
  }
}

export type ConfirmCancelCampaignProps = {
  tenantSlug: string;
  campaignId: string;
  campaignTitle: string;
  onCancelled?: () => void;
};

export const ConfirmCancelCampaignModal = ({
  tenantSlug,
  campaignId,
  campaignTitle,
  onCancelled,
  onClose,
}: ConfirmCancelCampaignProps & ModalBaseProps) => {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateCampaign(tenantSlug);

  const handleCancel = async () => {
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug, id: campaignId } },
        body: { status: "CANCELLED" },
      });
      onCancelled?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    }
  }

  return (
    <BaseModal
      title={`Cancel "${campaignTitle}"?`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Cancel campaign", onClick: handleCancel, loading: isPending, destructive: true }}
      secondaryAction={{ label: "Keep open", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        Sets the campaign status to <strong>Cancelled</strong>. Members will no longer see it in the giving flow,
        and existing pledges remain on the books for record-keeping.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
