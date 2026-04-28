"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar, Chip, Icon, Input, Select, type IconName } from "@/components/primitives";
import { cn } from "@/lib/utils";
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

const todayInputValue = (): string => {
  return new Date().toISOString().slice(0, 10);
};

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

  const { data: campaignDetail } = useCampaign(tenantSlug, campaignId, Boolean(campaignId));
  const campaignItems = campaignDetail?.items ?? [];

  const { data: pledgesData } = usePledges(
    tenantSlug,
    { memberId, status: "ACTIVE", campaignId: campaignId || undefined, limit: 20 },
    Boolean(memberId),
  );
  const pledges = pledgesData?.items ?? [];

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
          .includes(q),
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
  };

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
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Amount</div>
          <div className="flex items-baseline gap-1.5 rounded-xl bg-input px-[18px] py-3.5">
            <span className="text-[22px] font-medium text-muted-foreground">{currency}</span>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="min-w-0 flex-1 border-none bg-transparent font-inherit text-[32px] font-semibold tracking-tight text-foreground outline-none tabular-nums placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Type</div>
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map((opt) => (
              <span key={opt.value} onClick={() => setType(opt.value)}>
                <Chip active={type === opt.value}>{opt.label}</Chip>
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <div>
            <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Member</div>
            {chosenMember ? (
              <div className="flex h-11 items-center gap-2.5 rounded-xl bg-input p-2.5">
                <Avatar name={`${chosenMember.firstName} ${chosenMember.lastName}`} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm">{chosenMember.firstName} {chosenMember.lastName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMemberId("");
                    setPledgeId("");
                  }}
                  className="cursor-pointer border-none bg-transparent font-inherit text-xs text-primary hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  icon="search"
                  placeholder="Search or leave blank for anonymous"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                />
                {memberSearch.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-[1] mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-border bg-card shadow-md">
                    {filteredMembers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground">No matches</div>
                    ) : (
                      filteredMembers.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setMemberId(m.id);
                            setMemberSearch("");
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent p-2 text-left font-inherit hover:bg-muted"
                        >
                          <Avatar name={`${m.firstName} ${m.lastName}`} size={24} />
                          <span className="text-[13px]">
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

        {campaigns.length > 0 && (
          <div
            className={cn(
              "grid gap-3.5",
              campaignId && campaignItems.length > 0 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
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
                  p.campaignItemId ? " · earmarked" : ""
                }`,
              })),
            ]}
          />
        )}

        <div>
          <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Payment method</div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {METHOD_OPTIONS.map((m) => {
              const active = paymentMethod === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setPaymentMethod(m.value)}
                  className={cn(
                    "cursor-pointer rounded-xl border-[1.5px] px-2 py-3 text-center font-inherit transition-colors",
                    active
                      ? "border-primary bg-accent text-primary"
                      : "border-transparent bg-muted text-secondary-foreground",
                  )}
                >
                  <div className="mb-1 grid place-items-center">
                    <Icon name={m.icon} size={18} />
                  </div>
                  <div className="text-[11px] font-medium">{m.label}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
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
          <p className="m-0 text-xs text-muted-foreground">
            This campaign uses {chosenCampaign.currency}; recording in the church&apos;s currency ({currency}).
          </p>
        )}

        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
