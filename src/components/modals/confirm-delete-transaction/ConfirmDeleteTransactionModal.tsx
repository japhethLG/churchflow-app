"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useDeleteTransaction } from "@/lib/api/transactions";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete-transaction": ConfirmDeleteTransactionProps;
  }
}

export type ConfirmDeleteTransactionProps = {
  tenantSlug: string;
  transactionId: string;
  amountLabel: string;
  onDeleted?: () => void;
};

export function ConfirmDeleteTransactionModal({
  tenantSlug,
  transactionId,
  amountLabel,
  onDeleted,
  onClose,
}: ConfirmDeleteTransactionProps & ModalBaseProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useDeleteTransaction(tenantSlug);

  async function handleDelete() {
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId: tenantSlug, id: transactionId } } });
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <BaseModal
      title={`Delete ${amountLabel} gift?`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Delete gift", onClick: handleDelete, loading: isPending, destructive: true }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        Removes this transaction from the ledger. Campaign and pledge totals will recompute. This is for
        correcting mis-entries — keep records honest.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
