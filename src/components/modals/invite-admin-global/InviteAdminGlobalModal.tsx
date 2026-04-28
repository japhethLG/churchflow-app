"use client";

import { useState } from "react";
import { Input, Select } from "@/components/primitives";
import { useTenants } from "@/lib/api/tenants";
import { useIssueInvitation } from "@/lib/api/invitations";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "invite-admin-global": InviteAdminGlobalProps;
  }
}

export type InviteAdminGlobalProps = Record<string, never>;

export const InviteAdminGlobalModal = ({ onClose }: InviteAdminGlobalProps & ModalBaseProps) => {
  const [email, setEmail] = useState("");
  const [tenantId, setTenantId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { data: tenantsData } = useTenants();
  const { mutateAsync, isPending } = useIssueInvitation();

  const tenants = tenantsData?.items ?? [];

  const handleInvite = async () => {
    if (!email.trim() || !tenantId) return;
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId } }, body: { email: email.trim(), role: "ADMIN" } });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    }
  };

  if (success) {
    return (
      <BaseModal
        overline="Invitation sent"
        title="Invite sent"
        size="sm"
        onClose={onClose}
        primaryAction={{ label: "Done", onClick: onClose }}
      >
        <p className="m-0 text-sm leading-relaxed text-secondary-foreground">
          Invite sent to <strong>{email}</strong>.
        </p>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      overline="Platform"
      title="Invite admin"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{
        label: "Send invite",
        onClick: handleInvite,
        loading: isPending,
        disabled: !email.trim() || !tenantId,
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Church"
          value={tenantId}
          onChange={setTenantId}
          placeholder="Select a church…"
          showEmptyOption
          options={tenants.filter((t) => !t.deletedAt).map((t) => ({ value: t.id, label: t.name }))}
        />
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
        />
        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
