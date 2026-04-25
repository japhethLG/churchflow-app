"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives/Input";
import { useIssueInvitation } from "@/lib/api/invitations";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "invite-tenant-admin": InviteTenantAdminProps;
  }
}

export type InviteTenantAdminProps = {
  tenantId: string;
  tenantName: string;
};

export function InviteTenantAdminModal({
  tenantId,
  tenantName,
  onClose,
}: InviteTenantAdminProps & ModalBaseProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { mutateAsync, isPending } = useIssueInvitation();

  async function handleInvite() {
    if (!email.trim()) return;
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId } }, body: { email: email.trim(), role: "ADMIN" } });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    }
  }

  if (success) {
    return (
      <BaseModal
        overline="Invitation sent"
        title="Invite sent"
        size="sm"
        onClose={onClose}
        primaryAction={{ label: "Done", onClick: onClose }}
      >
        <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
          An invitation has been sent to <strong>{email}</strong>. They&apos;ll join {tenantName} as an admin once they accept.
        </p>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      overline={tenantName}
      title="Invite admin"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Send invite", onClick: handleInvite, loading: isPending, disabled: !email.trim() }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
          The invited user will receive a link to join {tenantName} as an admin.
        </p>
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
        />
        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}
