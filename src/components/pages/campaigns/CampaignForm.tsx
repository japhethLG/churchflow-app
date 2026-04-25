"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Button, Card, Icon, Input, SectionTitle } from "@/components/primitives";
import type { components } from "@/lib/api";

type CampaignStatus = components["schemas"]["CampaignResponseDto"]["status"];

export type CampaignFormItemDraft = {
  // tempId only used as React key in create mode
  tempId: string;
  // Item id when editing existing items (omitted on submit for new items)
  id?: string;
  title: string;
  description: string;
  targetAmount: string;
  deadline: string; // YYYY-MM-DD or ""
};

export type CampaignFormValue = {
  title: string;
  description: string;
  currency: string;
  deadline: string; // YYYY-MM-DD or ""
  status: CampaignStatus;
  items: CampaignFormItemDraft[];
};

const STATUS_OPTIONS: { value: CampaignStatus; label: string; hint: string }[] = [
  { value: "DRAFT", label: "Draft", hint: "Hidden from members" },
  { value: "ACTIVE", label: "Active", hint: "Open for pledges" },
];

let _itemIdCounter = 0;
export const newItemDraft = (seed: Partial<CampaignFormItemDraft> = {}): CampaignFormItemDraft  => {
  _itemIdCounter += 1;
  return {
    tempId: `tmp-${_itemIdCounter}`,
    title: "",
    description: "",
    targetAmount: "",
    deadline: "",
    ...seed,
  };
}

export const CampaignForm = ({
  value,
  onChange,
  onSubmit,
  onCancel,
  submitting,
  submitLabel,
  showStatus = true,
  // When editing, items already exist in DB — we still allow adding new
  // ones inline, but we don't delete from this form (use the items list).
  itemsEditable = true,
  error,
}: {
  value: CampaignFormValue;
  onChange: (v: CampaignFormValue) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitting?: boolean;
  submitLabel: string;
  showStatus?: boolean;
  itemsEditable?: boolean;
  error?: string | null;
}) => {
  const canSubmit =
    value.title.trim().length > 0 &&
    value.currency.trim().length === 3 &&
    value.items.every(
      (i) => i.title.trim().length > 0 && Number(i.targetAmount) > 0
    );

  const setItem = (idx: number, patch: Partial<CampaignFormItemDraft>) => {
    const next = [...value.items];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...value, items: next });
  }

  const removeItem = (idx: number) => {
    const next = value.items.filter((_, i) => i !== idx);
    onChange({ ...value, items: next });
  }

  const addItem = () => {
    onChange({ ...value, items: [...value.items, newItemDraft()] });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card padding={24}>
        <SectionTitle title="Campaign details" />
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input
            label="Title"
            placeholder="Building Fund"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
          <Input
            label="Description (optional)"
            placeholder="What this campaign is raising for…"
            value={value.description}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
          />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Currency (ISO 4217)"
              placeholder="USD"
              value={value.currency}
              onChange={(e) =>
                onChange({ ...value, currency: e.target.value.toUpperCase().slice(0, 3) })
              }
              helper="Inherited from your church on first save"
            />
            <Input
              label="Deadline (optional)"
              placeholder="YYYY-MM-DD"
              type="date"
              value={value.deadline}
              onChange={(e) => onChange({ ...value, deadline: e.target.value })}
              helper="Leave blank for open-ended"
            />
          </div>

          {showStatus && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
                Status
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange({ ...value, status: opt.value })}
                    style={{
                      flex: 1,
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1.5px solid ${value.status === opt.value ? S.primary : "transparent"}`,
                      background: value.status === opt.value ? S.primaryFixed : S.surfaceContainerHigh,
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
          )}
        </div>
      </Card>

      <Card padding={24}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <SectionTitle title="Line items" />
          {itemsEditable && (
            <Button variant="secondary" size="sm" icon="plus" onClick={addItem}>
              Add item
            </Button>
          )}
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 12, color: S.onSurfaceMuted }}>
          The campaign goal is the sum of these items&apos; targets. Members can pledge to a single item or to the
          campaign as a whole.
        </p>

        {value.items.length === 0 ? (
          <div
            style={{
              padding: "24px 16px",
              border: `1.5px dashed ${S.surfaceContainerHigh}`,
              borderRadius: 12,
              textAlign: "center",
              color: S.onSurfaceMuted,
              fontSize: 13,
            }}
          >
            Add at least one item to start tracking pledges.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {value.items.map((item, idx) => (
              <div
                key={item.tempId}
                style={{
                  padding: 16,
                  background: S.surfaceContainerLow,
                  borderRadius: 12,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "start",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10 }}>
                    <Input
                      placeholder="Roofing"
                      value={item.title}
                      onChange={itemsEditable ? (e) => setItem(idx, { title: e.target.value }) : undefined}
                      disabled={!itemsEditable}
                    />
                    <Input
                      placeholder="0.00"
                      type="number"
                      value={item.targetAmount}
                      onChange={itemsEditable ? (e) => setItem(idx, { targetAmount: e.target.value }) : undefined}
                      prefix={value.currency || ""}
                      disabled={!itemsEditable}
                    />
                    <Input
                      placeholder="YYYY-MM-DD"
                      type="date"
                      value={item.deadline}
                      onChange={itemsEditable ? (e) => setItem(idx, { deadline: e.target.value }) : undefined}
                      disabled={!itemsEditable}
                    />
                  </div>
                  <Input
                    placeholder="Description (optional)"
                    value={item.description}
                    onChange={itemsEditable ? (e) => setItem(idx, { description: e.target.value }) : undefined}
                    disabled={!itemsEditable}
                  />
                </div>
                {itemsEditable && (
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => removeItem(idx)}
                    style={{
                      width: 36,
                      height: 36,
                      background: S.surfaceContainer,
                      borderRadius: 9999,
                      border: "none",
                      cursor: "pointer",
                      color: S.onSurfaceMuted,
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Icon name="trash" size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {error && (
        <div style={{ padding: "12px 16px", background: S.errorContainer, color: S.error, borderRadius: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <Button variant="tertiary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSubmit} disabled={!canSubmit || submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
