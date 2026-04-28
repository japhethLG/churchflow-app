"use client";

import { useState } from "react";
import { Input } from "@/components/primitives";
import { useAddCampaignItem } from "@/lib/api/campaigns";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "add-campaign-item": AddCampaignItemProps;
  }
}

export type AddCampaignItemProps = {
  tenantSlug: string;
  campaignId: string;
  currency: string;
  defaultSortOrder?: number;
};

export const AddCampaignItemModal = ({
  tenantSlug,
  campaignId,
  currency,
  defaultSortOrder,
  onClose,
}: AddCampaignItemProps & ModalBaseProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useAddCampaignItem(tenantSlug);

  const canSubmit = title.trim().length > 0 && Number(target) > 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug, id: campaignId } },
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          targetAmount: Number(target),
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
          sortOrder: defaultSortOrder ?? 0,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  return (
    <BaseModal
      overline="Campaign"
      title="Add line item"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Add item", onClick: handleSave, loading: isPending, disabled: !canSubmit }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div className="flex flex-col gap-3.5">
        <Input label="Title" placeholder="Roofing" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Target amount"
            type="number"
            placeholder="0.00"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            prefix={currency}
          />
          <Input
            label="Deadline (optional)"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            helper="Inherits campaign deadline if blank"
          />
        </div>
        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
