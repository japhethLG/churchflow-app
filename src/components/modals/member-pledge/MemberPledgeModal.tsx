"use client";

import { useState } from "react";
import { Input } from "@/components/primitives";
import { useCreatePledge } from "@/lib/api/pledges";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";
import { cn } from "@/lib/utils";

type Item = components["schemas"]["CampaignItemResponseDto"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "member-pledge": MemberPledgeProps;
  }
}

export type MemberPledgeProps = {
  tenantSlug: string;
  campaignId: string;
  campaignTitle: string;
  currency: string;
  memberId: string;
  items: Item[];
};

export const MemberPledgeModal = ({
  tenantSlug,
  campaignId,
  campaignTitle,
  currency,
  memberId,
  items,
  onClose,
}: MemberPledgeProps & ModalBaseProps) => {
  const { mutateAsync, isPending } = useCreatePledge(tenantSlug);

  const [chosenItemId, setChosenItemId] = useState<string | "">("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Number(amount) > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          campaignId,
          campaignItemId: chosenItemId || undefined,
          memberId,
          pledgedAmount: Number(amount),
          note: note.trim() || undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create pledge");
    }
  };

  const currencySymbol =
    currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency;

  return (
    <BaseModal
      overline="Make a pledge"
      title={campaignTitle}
      size="sm"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{
        label: "Pledge",
        onClick: handleCreate,
        loading: isPending,
        disabled: !canSubmit,
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div className="flex flex-col gap-4">
        {items.length > 0 && (
          <div>
            <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Pledge toward</div>
            <div className="flex flex-col gap-1.5">
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 transition-colors duration-150",
                  chosenItemId === "" ? "bg-accent" : "bg-muted",
                )}
              >
                <input
                  type="radio"
                  name="pledgeItem"
                  checked={chosenItemId === ""}
                  onChange={() => setChosenItemId("")}
                  className="accent-primary"
                />
                <span className="text-sm font-medium text-foreground">Whole campaign</span>
              </label>
              {items.map((item) => (
                <label
                  key={item.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 transition-colors duration-150",
                    chosenItemId === item.id ? "bg-accent" : "bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    name="pledgeItem"
                    checked={chosenItemId === item.id}
                    onChange={() => setChosenItemId(item.id)}
                    className="accent-primary"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Goal: {currencySymbol}
                      {Number(item.targetAmount).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <Input
          label="Pledged amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefix={currencySymbol}
        />

        <Input
          label="Note (optional)"
          placeholder="e.g. paying over 6 months"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
