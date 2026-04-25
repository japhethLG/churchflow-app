"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives";
import { useCreatePledge } from "@/lib/api/pledges";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";

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
  }

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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Item picker (if campaign has items) */}
        {items.length > 0 && (
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: S.onSurfaceVariant,
                marginBottom: 8,
              }}
            >
              Pledge toward
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: chosenItemId === "" ? S.primaryFixed : S.surfaceContainerLow,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
              >
                <input
                  type="radio"
                  name="pledgeItem"
                  checked={chosenItemId === ""}
                  onChange={() => setChosenItemId("")}
                  style={{ accentColor: S.primary }}
                />
                <span style={{ fontSize: 14, fontWeight: 500, color: S.onSurface }}>
                  Whole campaign
                </span>
              </label>
              {items.map((item) => (
                <label
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: chosenItemId === item.id ? S.primaryFixed : S.surfaceContainerLow,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  <input
                    type="radio"
                    name="pledgeItem"
                    checked={chosenItemId === item.id}
                    onChange={() => setChosenItemId(item.id)}
                    style={{ accentColor: S.primary }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: S.onSurface }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 12, color: S.onSurfaceMuted }}>
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

        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}
