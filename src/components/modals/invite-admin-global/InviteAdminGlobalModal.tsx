"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives/Input";
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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
            Church
          </div>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: S.radiusMd,
              border: `1.5px solid ${S.outlineVariant}`,
              fontSize: 14,
              fontFamily: "inherit",
              background: S.surfaceContainerLow,
              color: tenantId ? S.onSurface : S.onSurfaceMuted,
              boxSizing: "border-box",
            }}
          >
            <option value="">Select a church…</option>
            {tenants
              .filter((t) => !t.deletedAt)
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
          </select>
        </div>
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
