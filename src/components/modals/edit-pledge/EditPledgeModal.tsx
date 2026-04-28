"use client";

import { useState } from "react";
import { Input } from "@/components/primitives";
import { useUpdatePledge } from "@/lib/api/pledges";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { nstr, type components } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  };

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
      <div className="flex flex-col gap-3.5">
        <Input
          label="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefix={currency}
        />

        <div>
          <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Status</div>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={cn(
                  "flex-1 cursor-pointer rounded-xl border-[1.5px] px-3.5 py-2.5 text-left font-inherit transition-colors",
                  status === opt.value
                    ? "border-primary bg-accent text-foreground"
                    : "border-transparent bg-input text-foreground",
                )}
              >
                <div className="text-[13px] font-semibold">{opt.label}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{opt.hint}</div>
              </button>
            ))}
          </div>
        </div>

        <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />

        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
