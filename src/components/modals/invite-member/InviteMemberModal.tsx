"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormInput, FormOptionGroup } from "@/components/formElements";
import { useIssueInvitation } from "@/lib/api/invitations";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import {
  inviteMemberSchema,
  ROLE_OPTIONS,
  type InviteMemberFormValues,
} from "./formHelpers";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "invite-member": InviteMemberProps;
  }
}

export type InviteMemberProps = {
  tenantId: string;
  claimMemberId?: string;
  claimMemberName?: string;
  defaultEmail?: string;
  defaultRole?: "ADMIN" | "USER";
};

export const InviteMemberModal = ({
  tenantId,
  claimMemberId,
  claimMemberName,
  defaultEmail,
  defaultRole,
  onClose,
}: InviteMemberProps & ModalBaseProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<{ email: string; role: "USER" | "ADMIN" } | null>(null);
  const { mutateAsync, isPending } = useIssueInvitation();

  const claiming = Boolean(claimMemberId);

  const methods = useForm<InviteMemberFormValues>({
    defaultValues: {
      email: defaultEmail ?? "",
      role: defaultRole ?? "USER",
    },
    resolver: zodResolver(inviteMemberSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: InviteMemberFormValues) => {
    setSubmitError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId } },
        body: {
          email: values.email.trim(),
          role: values.role,
          ...(claimMemberId ? { memberId: claimMemberId } : {}),
        },
      });
      setSentTo({ email: values.email.trim(), role: values.role });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to send invite");
    }
  };

  if (sentTo) {
    return (
      <BaseModal
        overline="Invitation sent"
        title="Invite sent"
        size="sm"
        onClose={onClose}
        primaryAction={{ label: "Done", onClick: onClose }}
      >
        <p className="m-0 text-sm leading-relaxed text-secondary-foreground">
          {claiming ? (
            <>
              An invitation has been sent to <strong>{sentTo.email}</strong>. When they accept, their existing profile
              {claimMemberName ? ` for ${claimMemberName}` : ""} — including all giving history — will be linked to their
              account.
            </>
          ) : (
            <>
              An invitation has been sent to <strong>{sentTo.email}</strong>. They&apos;ll join the church as{" "}
              {sentTo.role === "ADMIN" ? "an admin" : "a member"} once they sign in with the link.
            </>
          )}
        </p>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      overline={claiming ? "Claim profile" : "Directory"}
      title={claiming ? `Invite ${claimMemberName ?? "member"} to claim profile` : "Invite member"}
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{
        label: "Send invite",
        onClick: methods.handleSubmit(onSubmit),
        loading: isPending,
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <p className="m-0 text-sm leading-relaxed text-secondary-foreground">
          {claiming ? (
            <>
              The invited person receives a Google sign-in link. When they accept, this temp profile is linked to their
              account — every transaction and pledge already recorded for this profile stays attached.
            </>
          ) : (
            <>
              The invited person receives a Google sign-in link. After they accept, a member profile is created
              automatically and they can pledge or give.
            </>
          )}
        </p>
        <FormInput
          inputName="email"
          label="Email address"
          type="email"
          placeholder="member@example.com"
        />
        <FormOptionGroup
          inputName="role"
          label="Role"
          variant="card"
          options={ROLE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            description: o.description,
          }))}
        />
        {submitError && <p className="m-0 text-sm text-destructive">{submitError}</p>}
      </Form>
    </BaseModal>
  );
};
