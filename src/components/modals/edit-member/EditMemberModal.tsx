"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormInput, FormOptionGroup } from "@/components/formElements";
import { useUpdateMember } from "@/lib/api/members";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";
import {
  buildEditMemberDefaults,
  editMemberSchema,
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  type EditMemberFormValues,
} from "./formHelpers";

type Member = components["schemas"]["MemberResponseDto"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "edit-member": EditMemberProps;
  }
}

export type EditMemberProps = {
  tenantSlug: string;
  member: Member;
};

export const EditMemberModal = ({
  tenantSlug,
  member,
  onClose,
}: EditMemberProps & ModalBaseProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateMember(tenantSlug);

  const methods = useForm<EditMemberFormValues>({
    defaultValues: buildEditMemberDefaults(member),
    resolver: zodResolver(editMemberSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: EditMemberFormValues) => {
    setSubmitError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug, id: member.id } },
        body: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim() || undefined,
          phone: values.phone.trim() || undefined,
          address: values.address.trim() || undefined,
          role: values.role,
          status: values.status,
        },
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  return (
    <BaseModal
      overline="Directory"
      title="Edit member"
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
        <div className="grid grid-cols-2 gap-3">
          <FormInput inputName="firstName" label="First name" />
          <FormInput inputName="lastName" label="Last name" />
        </div>
        <FormInput inputName="email" label="Email" type="email" />
        <FormInput inputName="phone" label="Phone" />
        <FormInput inputName="address" label="Address" />

        <div className="grid grid-cols-2 gap-3">
          <FormOptionGroup
            inputName="role"
            label="Role"
            variant="pill"
            options={ROLE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
          <FormOptionGroup
            inputName="status"
            label="Status"
            variant="pill"
            options={STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>

        {submitError && <p className="m-0 text-sm text-destructive">{submitError}</p>}
      </Form>
    </BaseModal>
  );
};
