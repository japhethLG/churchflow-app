"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useCancelInvitation } from "@/lib/api/invitations";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "cancel-invitation": CancelInvitationProps;
  }
}

export type CancelInvitationProps = {
  tenantId: string;
  invitationId: string;
  email: string;
};

export function CancelInvitationModal({
  tenantId,
  invitationId,
  email,
  onClose,
}: CancelInvitationProps & ModalBaseProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useCancelInvitation();

  async function handleCancel() {
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId, invitationId } },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invitation");
    }
  }

  return (
    <BaseModal
      overline="Cancel invitation"
      title="Cancel this invitation?"
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{
        label: "Cancel invitation",
        onClick: handleCancel,
        loading: isPending,
      }}
      secondaryAction={{ label: "Keep it", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        The invitation to <strong>{email}</strong> will be cancelled immediately.
        The invite link they received will no longer work. You can always send a
        new invitation later.
      </p>
      {error && <p style={{ margin: 0, fontSize: 13, color: S.error, marginTop: 8 }}>{error}</p>}
    </BaseModal>
  );
}
