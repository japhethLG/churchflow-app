"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useDeletePledge } from "@/lib/api/pledges";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete-pledge": ConfirmDeletePledgeProps;
  }
}

export type ConfirmDeletePledgeProps = {
  tenantSlug: string;
  pledgeId: string;
};

export const ConfirmDeletePledgeModal = ({
  tenantSlug,
  pledgeId,
  onClose,
}: ConfirmDeletePledgeProps & ModalBaseProps) => {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useDeletePledge(tenantSlug);

  const handleDelete = async () => {
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId: tenantSlug, id: pledgeId } } });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete pledge");
    }
  }

  return (
    <BaseModal
      title="Delete pledge?"
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Delete pledge", onClick: handleDelete, loading: isPending, destructive: true }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        Removes this pledge from the campaign&apos;s totals. Use <strong>Edit → Cancelled</strong> instead if you
        want to keep the record visible.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
