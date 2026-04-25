"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "confirm-delete": ConfirmDeleteProps;
  }
}

export type ConfirmDeleteProps = {
  title: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => Promise<void> | void;
};

export const ConfirmDeleteModal = ({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: ConfirmDeleteProps & ModalBaseProps) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <BaseModal
      title={title}
      size="sm"
      onClose={onClose}
      dismissible={!busy}
      primaryAction={{ label: confirmLabel, onClick: handleConfirm, loading: busy, destructive: true }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: busy }}
    >
      {message && (
        <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
          {message}
        </p>
      )}
      {error && (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: S.error }}>{error}</p>
      )}
    </BaseModal>
  );
}
