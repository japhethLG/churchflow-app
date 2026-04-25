"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives/Input";
import { useUpdateTenant } from "@/lib/api/tenants";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "edit-tenant": EditTenantProps;
  }
}

export type EditTenantProps = {
  tenantId: string;
  currentName: string;
  currentDescription?: string | null;
};

export function EditTenantModal({
  tenantId,
  currentName,
  currentDescription,
  onClose,
}: EditTenantProps & ModalBaseProps) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateTenant();

  async function handleSave() {
    if (!name.trim()) return;
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId } }, body: { name: name.trim() } });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  }

  return (
    <BaseModal
      overline="Church details"
      title="Edit church"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Save", onClick: handleSave, loading: isPending, disabled: !name.trim() }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input label="Church name" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
            Description
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: S.radiusMd,
              border: `1.5px solid ${S.outlineVariant}`,
              fontSize: 14,
              fontFamily: "inherit",
              color: S.onSurface,
              background: S.surfaceContainerLow,
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>
        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}
