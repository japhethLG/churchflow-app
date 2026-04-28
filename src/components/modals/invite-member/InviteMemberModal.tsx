"use client";

import { useState } from "react";
import { Input } from "@/components/primitives";
import { useIssueInvitation } from "@/lib/api/invitations";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { cn } from "@/lib/utils";

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

type Role = "ADMIN" | "USER";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: "USER",
    label: "Member",
    description:
      "Can view their own giving history, make pledges, and browse public campaigns.",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full access to financials, member directory, campaigns, settings, and reports.",
  },
];

export const InviteMemberModal = ({
  tenantId,
  claimMemberId,
  claimMemberName,
  defaultEmail,
  defaultRole,
  onClose,
}: InviteMemberProps & ModalBaseProps) => {
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [role, setRole] = useState<Role>(defaultRole ?? "USER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { mutateAsync, isPending } = useIssueInvitation();

  const claiming = Boolean(claimMemberId);

  const handleInvite = async () => {
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
          {claiming ? (
            <>
              An invitation has been sent to <strong>{email}</strong>. When they accept, their existing profile
              {claimMemberName ? ` for ${claimMemberName}` : ""} — including all giving history — will be linked to their
              account.
            </>
          ) : (
            <>
              An invitation has been sent to <strong>{email}</strong>. They&apos;ll join the church as{" "}
              {role === "ADMIN" ? "an admin" : "a member"} once they sign in with the link.
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
      <div className="flex flex-col gap-4">
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
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="member@example.com"
        />

        <div>
          <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Role</div>
          <div className="flex gap-2.5">
            {ROLE_OPTIONS.map((opt) => {
              const selected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value)}
                  className={cn(
                    "flex-1 cursor-pointer rounded-xl border-[1.5px] px-3.5 py-3 text-left font-inherit transition-all duration-150",
                    selected ? "border-primary bg-card" : "border-input bg-muted",
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 text-sm font-semibold",
                      selected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {opt.label}
                  </div>
                  <div
                    className={cn(
                      "text-[12px] leading-snug",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {opt.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
