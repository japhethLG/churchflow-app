"use client";

import { useState } from "react";
import { Input } from "@/components/primitives/Input";
import { useUpdateTenant } from "@/lib/api/tenants";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { cn } from "@/lib/utils";

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

export const EditTenantModal = ({
  tenantId,
  currentName,
  currentDescription,
  onClose,
}: EditTenantProps & ModalBaseProps) => {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription ?? "");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateTenant();

  const handleSave = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId } }, body: { name: name.trim() } });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

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
      <div className="flex flex-col gap-4">
        <Input label="Church name" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Description</div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={cn(
              "box-border w-full resize-y rounded-md border-[1.5px] border-border bg-muted px-4 py-3 font-inherit text-sm text-foreground",
              "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
            )}
          />
        </div>
        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
