"use client";

import { useEffect, useMemo, useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Avatar, Chip, Icon, Input, type IconName } from "@/components/primitives";
import { useCampaign, useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import { useTenant } from "@/lib/api/tenants";
import { useCreateTransaction } from "@/lib/api/transactions";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";

type TransactionType = components["schemas"]["TransactionResponseDto"]["type"];
type PaymentMethod = components["schemas"]["TransactionResponseDto"]["paymentMethod"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "record-gift": RecordGiftProps;
  }
}

export type RecordGiftProps = {
  tenantSlug: string;
  // Optional defaults so callers from a campaign / member detail can
  // pre-fill context for the user.
  defaultMemberId?: string;
  defaultCampaignId?: string;
  defaultPledgeId?: string;
};

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "TITHE", label: "Tithe" },
  { value: "OFFERING", label: "Offering" },
  { value: "MISSION_GIVING", label: "Mission" },
  { value: "FIRST_FRUIT", label: "First Fruit" },
  { value: "COMMITMENT", label: "Commitment" },
  { value: "DONATION", label: "Donation" },
  { value: "OTHER", label: "Other" },
];

const METHOD_OPTIONS: { value: PaymentMethod; label: string; icon: IconName }[] = [
  { value: "CASH", label: "Cash", icon: "cash" },
  { value: "CHECK", label: "Check", icon: "check_rect" },
  { value: "BANK_TRANSFER", label: "Bank", icon: "bank" },
  { value: "MOBILE_MONEY", label: "Mobile", icon: "phone" },
  { value: "ONLINE", label: "Online", icon: "link" },
  { value: "OTHER", label: "Other", icon: "dots" },
];

const todayInputValue = (): string  => {
  return new Date().toISOString().slice(0, 10);
}

export const RecordGiftModal = ({
  tenantSlug,
  defaultMemberId,
  defaultCampaignId,
  defaultPledgeId,
  onClose,
}: RecordGiftProps & ModalBaseProps) => {
  const { data: tenant } = useTenant(tenantSlug);
  const { data: membersData } = useMembers(tenantSlug, { limit: 200 });
  const { data: campaignsData } = useCampaigns(tenantSlug);
  const { mutateAsync, isPending } = useCreateTransaction(tenantSlug);

  const [type, setType] = useState<TransactionType>("TITHE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayInputValue());
  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [memberSearch, setMemberSearch] = useState("");
  const [campaignId, setCampaignId] = useState<string | "">(defaultCampaignId ?? "");
  const [campaignItemId, setCampaignItemId] = useState<string | "">("");
  const [pledgeId, setPledgeId] = useState<string | "">(defaultPledgeId ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const members = membersData?.items ?? [];
  const campaigns = (campaignsData?.items ?? []).filter((c) => c.status === "ACTIVE" || c.id === campaignId);
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const chosenMember = memberById[memberId];
  const chosenCampaign = campaigns.find((c) => c.id === campaignId);

  // Fetch the picked campaign's items so the user can earmark to a
  // specific item. Only fires once a campaign is chosen.
  const { data: campaignDetail } = useCampaign(tenantSlug, campaignId, Boolean(campaignId));
  const campaignItems = campaignDetail?.items ?? [];

  // Pull this member's active pledges against the chosen campaign so we
  // can auto-attribute. If no campaign is set, also surface their other
  // active pledges so the admin can pick one and infer the campaign.
  const { data: pledgesData } = usePledges(
    tenantSlug,
    { memberId, status: "ACTIVE", campaignId: campaignId || undefined, limit: 20 },
    Boolean(memberId)
  );
  const pledges = pledgesData?.items ?? [];

  // If a pledge is picked, the campaign + item are inherited. Keep them
  // in sync visually so the form mirrors what the backend will store.
  useEffect(() => {
    if (!pledgeId) return;
    const p = pledges.find((x) => x.id === pledgeId);
    if (!p) return;
    if (p.campaignId !== campaignId) setCampaignId(p.campaignId);
    const itemId = typeof p.campaignItemId === "string" ? p.campaignItemId : "";
    if (itemId !== campaignItemId) setCampaignItemId(itemId);
  }, [pledgeId, pledges, campaignId, campaignItemId]);

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members.slice(0, 8);
    return members
      .filter((m) =>
        `${m.firstName} ${m.lastName} ${typeof m.email === "string" ? m.email : ""}`
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 8);
  }, [members, memberSearch]);

  const canSubmit = Number(amount) > 0 && Boolean(date) && Boolean(paymentMethod);

  const handleSave = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          type,
          amount: Number(amount),
          date: new Date(date).toISOString(),
          paymentMethod,
          memberId: memberId || undefined,
          campaignId: campaignId || undefined,
          campaignItemId: campaignItemId || undefined,
          pledgeId: pledgeId || undefined,
          note: note.trim() || undefined,
          referenceNumber: referenceNumber.trim() || undefined,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record gift");
    }
  }

  const currency = tenant?.currency ?? "USD";

  return (
    <BaseModal
      overline="New entry"
      title="Record a gift"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      footerHint="⌘ Enter to record · Esc to cancel"
      primaryAction={{ label: "Record gift", onClick: handleSave, loading: isPending, disabled: !canSubmit }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Amount — display-style input */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
            Amount
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 6,
              padding: "14px 18px",
              background: S.surfaceContainerHigh,
              borderRadius: 12,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 500, color: S.onSurfaceMuted }}>{currency}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 32,
                fontWeight: 600,
                letterSpacing: "-0.025em",
                color: S.onSurface,
                fontFamily: "inherit",
                fontVariantNumeric: "tabular-nums",
                width: "100%",
                minWidth: 0,
              }}
            />
          </div>
        </div>

        {/* Type chips */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
            Type
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TYPE_OPTIONS.map((opt) => (
              <span key={opt.value} onClick={() => setType(opt.value)}>
                <Chip active={type === opt.value}>{opt.label}</Chip>
              </span>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
              Member
            </div>
            {chosenMember ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  background: S.surfaceContainerHigh,
                  borderRadius: 12,
                  height: 44,
                }}
              >
                <Avatar name={`${chosenMember.firstName} ${chosenMember.lastName}`} size={28} />
                <span style={{ flex: 1, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {chosenMember.firstName} {chosenMember.lastName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMemberId("");
                    setPledgeId("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: S.primary,
                    cursor: "pointer",
                    fontSize: 12,
                    fontFamily: "inherit",
                  }}
                >
                  Change
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <Input
                  icon="search"
                  placeholder="Search or leave blank for anonymous"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
                {memberSearch.trim().length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      background: S.surfaceContainerLowest,
                      border: `1px solid ${S.surfaceContainer}`,
                      borderRadius: 12,
                      maxHeight: 200,
                      overflowY: "auto",
                      zIndex: 1,
                      boxShadow: "0 8px 24px -10px rgba(0,0,0,0.15)",
                    }}
                  >
                    {filteredMembers.length === 0 ? (
                      <div style={{ padding: 12, fontSize: 12, color: S.onSurfaceMuted, textAlign: "center" }}>
                        No matches
                      </div>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMemberId(m.id);
                            setMemberSearch("");
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: 8,
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "inherit",
                          }}
                        >
                          <Avatar name={`${m.firstName} ${m.lastName}`} size={24} />
                          <span style={{ fontSize: 13 }}>
                            {m.firstName} {m.lastName}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Campaign + (when picked) line item earmark */}
        {campaigns.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: campaignId && campaignItems.length > 0 ? "1fr 1fr" : "1fr", gap: 14 }}>
            <Select
              label="Campaign (optional)"
              value={campaignId}
              onChange={(v) => {
                setCampaignId(v);
                setCampaignItemId("");
                setPledgeId("");
              }}
              options={[
                { value: "", label: "None" },
                ...campaigns.map((c) => ({ value: c.id, label: c.title })),
              ]}
            />
            {campaignId && campaignItems.length > 0 && (
              <Select
                label="Earmark (optional)"
                value={campaignItemId}
                onChange={setCampaignItemId}
                disabled={Boolean(pledgeId)}
                hint={pledgeId ? "Locked by pledge attribution" : undefined}
                options={[
                  { value: "", label: "Whole campaign" },
                  ...campaignItems.map((it) => ({ value: it.id, label: it.title })),
                ]}
              />
            )}
          </div>
        )}

        {/* Pledge — only shown when the chosen member has active pledges. */}
        {pledges.length > 0 && (
          <Select
            label="Against pledge (optional)"
            value={pledgeId}
            onChange={setPledgeId}
            options={[
              { value: "", label: "Don't link a pledge" },
              ...pledges.map((p) => ({
                value: p.id,
                label: `${currency} ${Number(p.pledgedAmount).toFixed(2)} pledge${
                  typeof p.campaignItemId === "string" ? " · earmarked" : ""
                }`,
              })),
            ]}
          />
        )}

        {/* Payment method grid */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
            Payment method
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {METHOD_OPTIONS.map((m) => {
              const active = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: 12,
                    textAlign: "center",
                    background: active ? S.primaryFixed : S.surfaceContainerLow,
                    color: active ? S.primary : S.onSurfaceVariant,
                    border: `1.5px solid ${active ? S.primary : "transparent"}`,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ display: "grid", placeItems: "center", marginBottom: 4 }}>
                    <Icon name={m.icon} size={18} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500 }}>{m.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Input
            label="Reference # (optional)"
            placeholder="CHK-1402"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
          />
          <Input
            label="Note (optional)"
            placeholder="e.g. Sunday Worship"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {chosenCampaign && chosenCampaign.currency !== currency && (
          <p style={{ margin: 0, fontSize: 12, color: S.onSurfaceMuted }}>
            This campaign uses {chosenCampaign.currency}; recording in the church&apos;s currency ({currency}).
          </p>
        )}

        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}

const Select = ({
  label,
  value,
  onChange,
  options,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  hint?: string;
}) => {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%",
          height: 44,
          padding: "0 14px",
          borderRadius: 12,
          background: disabled ? S.surfaceContainer : S.surfaceContainerHigh,
          border: "none",
          fontFamily: "inherit",
          fontSize: 14,
          color: S.onSurface,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
