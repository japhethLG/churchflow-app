"use client";

import { useMemo, useState } from "react";
import { Avatar, Input, Select } from "@/components/primitives";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useCreatePledge } from "@/lib/api/pledges";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";

type Campaign = components["schemas"]["CampaignResponseDto"];
type Item = components["schemas"]["CampaignItemResponseDto"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "create-pledge": CreatePledgeProps;
  }
}

export type CreatePledgeProps = {
  tenantSlug: string;
  campaignId: string;
  campaignTitle: string;
  currency: string;
  items: Item[];
  defaultMemberId?: string;
};

export const CreatePledgeModal = ({
  tenantSlug,
  campaignId,
  campaignTitle,
  currency,
  items,
  defaultMemberId,
  onClose,
}: CreatePledgeProps & ModalBaseProps) => {
  const { data: membersData } = useMembers(tenantSlug, { limit: 200 });
  const { data: campaignsData } = useCampaigns(tenantSlug);
  const { mutateAsync, isPending } = useCreatePledge(tenantSlug);

  const [memberId, setMemberId] = useState(defaultMemberId ?? "");
  const [memberSearch, setMemberSearch] = useState("");
  const [chosenCampaignId, setChosenCampaignId] = useState(campaignId);
  const [chosenItemId, setChosenItemId] = useState<string | "">("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const members = membersData?.items ?? [];
  const campaigns: Campaign[] = campaignsData?.items ?? [];
  const memberById = Object.fromEntries(members.map((m) => [m.id, m]));
  const chosenMember = memberById[memberId];

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members.slice(0, 8);
    return members
      .filter((m) =>
        `${m.firstName} ${m.lastName} ${m.email ?? ""}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [members, memberSearch]);

  const itemsForCampaign: Item[] = chosenCampaignId === campaignId ? items : [];

  const canSubmit = Boolean(memberId) && Number(amount) > 0;

  const handleCreate = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          campaignId: chosenCampaignId,
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

  return (
    <BaseModal
      overline="Pledge"
      title={`New pledge — ${campaignTitle}`}
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Create pledge", onClick: handleCreate, loading: isPending, disabled: !canSubmit }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div className="flex flex-col gap-4">
        {campaigns.length > 1 && (
          <Select
            label="Campaign"
            value={chosenCampaignId}
            onChange={(v) => {
              setChosenCampaignId(v);
              setChosenItemId("");
            }}
            options={campaigns.map((c) => ({ value: c.id, label: c.title }))}
          />
        )}

        {itemsForCampaign.length > 0 && (
          <Select
            label="Campaign item"
            value={chosenItemId}
            onChange={setChosenItemId}
            options={[
              { value: "", label: "Whole campaign" },
              ...itemsForCampaign.map((i) => ({ value: i.id, label: i.title })),
            ]}
          />
        )}

        <div>
          <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Member</div>
          {chosenMember ? (
            <div className="flex items-center gap-3 rounded-xl bg-muted p-3">
              <Avatar name={`${chosenMember.firstName} ${chosenMember.lastName}`} size={36} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {chosenMember.firstName} {chosenMember.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(chosenMember.email as string | null) ?? "no email"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMemberId("")}
                className="cursor-pointer border-none bg-transparent font-inherit text-[13px] text-primary hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <Input
                icon="search"
                placeholder="Search by name or email…"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
              />
              <div className="mt-2 max-h-[220px] overflow-y-auto rounded-xl border border-border">
                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-[13px] text-muted-foreground">No matches</div>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMemberId(m.id)}
                      className="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent p-2.5 text-left font-inherit hover:bg-muted"
                    >
                      <Avatar name={`${m.firstName} ${m.lastName}`} size={28} />
                      <span className="text-sm">{m.firstName} {m.lastName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {(m.email as string | null) ?? ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <Input
          label="Pledged amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          prefix={currency}
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
