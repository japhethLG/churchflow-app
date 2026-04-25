"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives";
import { useIssueInvitation } from "@/lib/api/invitations";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "invite-member": InviteMemberProps;
  }
}

export type InviteMemberProps = {
  tenantId: string;
  // When set, the invite claims an existing temp member: on accept the
  // user is linked to this row instead of creating a new one. Their
  // existing giving history is preserved.
  claimMemberId?: string;
  claimMemberName?: string;
  defaultEmail?: string;
  /** Pre-select a role. When omitted defaults to USER. */
  defaultRole?: "ADMIN" | "USER";
};

type Role = "ADMIN" | "USER";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: "USER", label: "Member", description: "Can view their own giving history, make pledges, and browse public campaigns." },
  { value: "ADMIN", label: "Admin", description: "Full access to financials, member directory, campaigns, settings, and reports." },
];

export function InviteMemberModal({
  tenantId,
  claimMemberId,
  claimMemberName,
  defaultEmail,
  defaultRole,
  onClose,
}: InviteMemberProps & ModalBaseProps) {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [role, setRole] = useState<Role>(defaultRole ?? "USER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { mutateAsync, isPending } = useIssueInvitation();

  const claiming = Boolean(claimMemberId);

  async function handleInvite() {
    if (!email.trim()) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId } },
        body: {
          email: email.trim(),
          role,
          ...(claimMemberId ? { memberId: claimMemberId } : {}),
        },
      });
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
          {claiming ? (
            <>
              An invitation has been sent to <strong>{email}</strong>. When they accept,
              their existing profile{claimMemberName ? ` for ${claimMemberName}` : ""} —
              including all giving history — will be linked to their account.
            </>
          ) : (
            <>
              An invitation has been sent to <strong>{email}</strong>. They&apos;ll join the
              church as {role === "ADMIN" ? "an admin" : "a member"} once they sign in with the link.
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
      primaryAction={{ label: "Send invite", onClick: handleInvite, loading: isPending, disabled: !email.trim() }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
          {claiming ? (
            <>
              The invited person receives a Google sign-in link. When they accept, this
              temp profile is linked to their account — every transaction and pledge
              already recorded for this profile stays attached.
            </>
          ) : (
            <>
              The invited person receives a Google sign-in link. After they accept,
              a member profile is created automatically and they can pledge or give.
            </>
          )}
        </p>
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@example.com"
        />

        {/* Role picker */}
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: S.onSurfaceMuted,
              marginBottom: 8,
            }}
          >
            Role
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {ROLE_OPTIONS.map((opt) => {
              const selected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  style={{
                    flex: 1,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${selected ? S.primary : S.surfaceContainerHigh}`,
                    background: selected ? S.primaryFixed : S.surfaceContainerLowest,
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: selected ? S.primary : S.onSurface,
                      marginBottom: 4,
                    }}
                  >
                    {opt.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: selected ? S.primary : S.onSurfaceMuted,
                      lineHeight: 1.4,
                    }}
                  >
                    {opt.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}
