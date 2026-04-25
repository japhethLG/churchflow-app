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
};

export function InviteMemberModal({
  tenantId,
  claimMemberId,
  claimMemberName,
  defaultEmail,
  onClose,
}: InviteMemberProps & ModalBaseProps) {
  const [email, setEmail] = useState(defaultEmail ?? "");
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
          role: "USER",
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
              church as a member once they sign in with the link.
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
        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}
