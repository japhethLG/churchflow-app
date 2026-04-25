"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useToggleSuperAdmin } from "@/lib/api/admin";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-toggle-super-admin": ConfirmToggleSuperAdminProps;
  }
}

export type ConfirmToggleSuperAdminProps = {
  userId: string;
  userName: string;
  currentIsSuperAdmin: boolean;
};

export function ConfirmToggleSuperAdminModal({
  userId,
  userName,
  currentIsSuperAdmin,
  onClose,
}: ConfirmToggleSuperAdminProps & ModalBaseProps) {
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useToggleSuperAdmin();
  const promoting = !currentIsSuperAdmin;

  async function handleToggle() {
    setError(null);
    try {
      await mutateAsync({
        params: { path: { id: userId } },
        body: { isSuperAdmin: promoting },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Operation failed");
    }
  }

  return (
    <BaseModal
      title={promoting ? `Promote ${userName}?` : `Demote ${userName}?`}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{
        label: promoting ? "Promote to super admin" : "Demote from super admin",
        onClick: handleToggle,
        loading: isPending,
        destructive: !promoting,
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
        {promoting
          ? `${userName} will gain full platform access including all churches and admin controls.`
          : `${userName} will lose platform-wide admin access. Their existing church memberships are unchanged.`}
      </p>
      <p style={{ margin: "12px 0 0", fontSize: 13, color: S.onSurfaceMuted, lineHeight: 1.5 }}>
        The user must sign out and back in for the change to take effect.
      </p>
      {error && <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>}
    </BaseModal>
  );
}
