"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormInput } from "@/components/formElements";
import { useAddCampaignItem } from "@/lib/api/campaigns";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import {
  addCampaignItemDefaults,
  addCampaignItemSchema,
  type AddCampaignItemFormValues,
} from "./formHelpers";

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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useAddCampaignItem(tenantSlug);

  const methods = useForm<AddCampaignItemFormValues>({
    defaultValues: addCampaignItemDefaults,
    resolver: zodResolver(addCampaignItemSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: AddCampaignItemFormValues) => {
    setSubmitError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug, id: campaignId } },
        body: {
          title: values.title.trim(),
          description: values.description.trim() || undefined,
          targetAmount: Number(values.target),
          deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
          sortOrder: defaultSortOrder ?? 0,
        },
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  return (
    <BaseModal
      overline="Campaign"
      title="Add line item"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{
        label: "Add item",
        onClick: methods.handleSubmit(onSubmit),
        loading: isPending,
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <FormInput inputName="title" label="Title" placeholder="Roofing" />
        <FormInput inputName="description" label="Description (optional)" />
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            inputName="target"
            label="Target amount"
            type="number"
            placeholder="0.00"
            prefix={currency}
          />
          <FormInput
            inputName="deadline"
            label="Deadline (optional)"
            type="date"
            helper="Inherits campaign deadline if blank"
          />
        </div>
        {submitError && <p className="m-0 text-sm text-destructive">{submitError}</p>}
      </Form>
    </BaseModal>
  );
};
