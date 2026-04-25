"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useDeleteTenant } from "@/lib/api/tenants";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete-tenant": ConfirmDeleteTenantProps;
  }
}

export type ConfirmDeleteTenantProps = {
  tenantId: string;
  tenantName: string;
  onDeleted?: () => void;
};

export function ConfirmDeleteTenantModal({
  tenantId,
  tenantName,
  onDeleted,
  onClose,
}: ConfirmDeleteTenantProps & ModalBaseProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useDeleteTenant();

  async function handleDelete() {
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId } } });
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <BaseModal
      title={`Delete "${tenantName}"?`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Delete church", onClick: handleDelete, loading: isPending, destructive: true }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        This will soft-delete the church. All data is preserved and the church can be restored later.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
