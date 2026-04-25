"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useRestoreTenant } from "@/lib/api/tenants";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-restore-tenant": ConfirmRestoreTenantProps;
  }
}

export type ConfirmRestoreTenantProps = {
  tenantId: string;
  tenantName: string;
  onRestored?: () => void;
};

export function ConfirmRestoreTenantModal({
  tenantId,
  tenantName,
  onRestored,
  onClose,
}: ConfirmRestoreTenantProps & ModalBaseProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useRestoreTenant();

  async function handleRestore() {
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId } } });
      onRestored?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore");
    }
  }

  return (
    <BaseModal
      title={`Restore "${tenantName}"?`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Restore church", onClick: handleRestore, loading: isPending }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        This will restore the church and all its data. Members and admins will regain access.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
