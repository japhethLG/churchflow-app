"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormInput, FormOptionGroup } from "@/components/formElements";
import { useUpdatePledge } from "@/lib/api/pledges";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";
import {
  buildEditPledgeDefaults,
  editPledgeSchema,
  STATUS_OPTIONS,
  type EditPledgeFormValues,
} from "./formHelpers";

type Pledge = components["schemas"]["PledgeResponseDto"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "edit-pledge": EditPledgeProps;
  }
}

export type EditPledgeProps = {
  tenantSlug: string;
  pledge: Pledge;
};

export const EditPledgeModal = ({
  tenantSlug,
  pledge,
  onClose,
}: EditPledgeProps & ModalBaseProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdatePledge(tenantSlug);

  const methods = useForm<EditPledgeFormValues>({
    defaultValues: buildEditPledgeDefaults(pledge),
    resolver: zodResolver(editPledgeSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: EditPledgeFormValues) => {
    setSubmitError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug, id: pledge.id } },
        body: {
          pledgedAmount: Number(values.amount),
          status: values.status,
          note: values.note.trim() || undefined,
        },
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to update pledge");
    }
  };

  return (
    <BaseModal
      overline="Pledge"
      title="Edit pledge"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{
        label: "Save",
        onClick: methods.handleSubmit(onSubmit),
        loading: isPending,
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <FormInput inputName="amount" label="Amount" type="number" />
        <FormOptionGroup
          inputName="status"
          label="Status"
          variant="card"
          options={STATUS_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            description: o.description,
          }))}
        />
        <FormInput inputName="note" label="Note" />
        {submitError && <p className="m-0 text-sm text-destructive">{submitError}</p>}
      </Form>
    </BaseModal>
  );
};
