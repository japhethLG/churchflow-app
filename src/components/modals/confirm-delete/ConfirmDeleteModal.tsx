"use client";

import { useState } from "react";
import { Button } from "@/components/primitives";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

// Register this modal's props on the global ModalPropsMap so
// openModal("confirm-delete", { ... }) is type-checked.
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

export function ConfirmDeleteModal({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onClose,
}: ConfirmDeleteProps & ModalBaseProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
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
      description={message}
      size="sm"
      onClose={onClose}
      dismissible={!busy}
      footer={
        <>
          <Button variant="tertiary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="primary" destructive onClick={handleConfirm} disabled={busy}>
            {busy ? "Deleting…" : confirmLabel}
          </Button>
        </>
      }
    >
      {error && (
        <div style={{ color: "#8C1D18", fontSize: 13, marginTop: 4 }}>{error}</div>
      )}
    </BaseModal>
  );
}
