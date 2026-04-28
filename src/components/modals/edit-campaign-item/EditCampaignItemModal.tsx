"use client";

import { useState } from "react";
import { Input } from "@/components/primitives";
import { useUpdateCampaignItem } from "@/lib/api/campaigns";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { nstr, type components } from "@/lib/api";

type Item = components["schemas"]["CampaignItemResponseDto"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "edit-campaign-item": EditCampaignItemProps;
  }
}

export type EditCampaignItemProps = {
  tenantSlug: string;
  campaignId: string;
  item: Item;
};

const toDateInput = (d: unknown): string => {
  const s = nstr(d);
  if (!s) return "";
  return new Date(s).toISOString().slice(0, 10);
};

export const EditCampaignItemModal = ({
  tenantSlug,
  campaignId,
  item,
  onClose,
}: EditCampaignItemProps & ModalBaseProps) => {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(nstr(item.description) ?? "");
  const [target, setTarget] = useState(item.targetAmount.toString());
  const [deadline, setDeadline] = useState(toDateInput(item.deadline));
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateCampaignItem(tenantSlug);

  const canSubmit = title.trim().length > 0 && Number(target) > 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug, id: campaignId, itemId: item.id } },
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          targetAmount: Number(target),
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  return (
    <BaseModal
      overline="Campaign"
      title="Edit line item"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Save", onClick: handleSave, loading: isPending, disabled: !canSubmit }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div className="flex flex-col gap-3.5">
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Target amount" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
          <Input label="Deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
