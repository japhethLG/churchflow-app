"use client";

import { useState } from "react";
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
      <p className="m-0 text-sm leading-relaxed text-secondary-foreground">
        Removes this pledge from the campaign&apos;s totals. Use <strong>Edit → Cancelled</strong> instead if you
        want to keep the record visible.
      </p>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </BaseModal>
  );
}
