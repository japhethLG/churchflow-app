"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives";
import { useUpdatePledge } from "@/lib/api/pledges";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { nstr, type components } from "@/lib/api";

type Pledge = components["schemas"]["PledgeResponseDto"];
type PledgeStatus = Pledge["status"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "edit-pledge": EditPledgeProps;
  }
}

export type EditPledgeProps = {
  tenantSlug: string;
  pledge: Pledge;
  currency: string;
};

const STATUS_OPTIONS: { value: PledgeStatus; label: string; hint: string }[] = [
  { value: "ACTIVE", label: "Active", hint: "Still owed" },
  { value: "FULFILLED", label: "Fulfilled", hint: "Fully paid" },
  { value: "CANCELLED", label: "Cancelled", hint: "Withdrawn" },
];

export const EditPledgeModal = ({
  tenantSlug,
  pledge,
  currency,
  onClose,
}: EditPledgeProps & ModalBaseProps) => {
  // campaignId / campaignItemId / memberId are immutable per SPECS §10.4 —
  // we only let the user edit amount, status, note.
  const [amount, setAmount] = useState(pledge.pledgedAmount.toString());
  const [status, setStatus] = useState<PledgeStatus>(pledge.status);
  const [note, setNote] = useState(nstr(pledge.note) ?? "");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdatePledge(tenantSlug);

  const canSubmit = Number(amount) > 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug, id: pledge.id } },
        body: {
          pledgedAmount: Number(amount),
          status,
          note: note.trim() || undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update pledge");
    }
  }

  return (
    <BaseModal
      overline="Pledge"
      title="Edit pledge"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Save", onClick: handleSave, loading: isPending, disabled: !canSubmit }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Input label="Amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} prefix={currency} />

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>Status</div>
          <div style={{ display: "flex", gap: 8 }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                style={{
                  flex: 1,
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${status === opt.value ? S.primary : "transparent"}`,
                  background: status === opt.value ? S.primaryFixed : S.surfaceContainerHigh,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: S.onSurface }}>{opt.label}</div>
                <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 2 }}>{opt.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />

        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}
