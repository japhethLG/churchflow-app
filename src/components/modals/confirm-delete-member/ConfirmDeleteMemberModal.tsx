"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useDeleteMember } from "@/lib/api/members";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete-member": ConfirmDeleteMemberProps;
  }
}

export type ConfirmDeleteMemberProps = {
  tenantSlug: string;
  memberId: string;
  memberName: string;
  onDeleted?: () => void;
};

export const ConfirmDeleteMemberModal = ({
  tenantSlug,
  memberId,
  memberName,
  onDeleted,
  onClose,
}: ConfirmDeleteMemberProps & ModalBaseProps) => {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useDeleteMember(tenantSlug);

  const handleDelete = async () => {
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId: tenantSlug, id: memberId } } });
      onDeleted?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  return (
    <BaseModal
      title={`Remove "${memberName}"?`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Remove member", onClick: handleDelete, loading: isPending, destructive: true }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        Removes this member from the church. Their giving history is preserved on the
        underlying user account but they will no longer appear in this directory.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
