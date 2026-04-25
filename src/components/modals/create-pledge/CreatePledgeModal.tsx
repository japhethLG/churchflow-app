"use client";

import { useMemo, useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Avatar, Input } from "@/components/primitives";
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
  // The campaign's items (for the optional item picker). Empty array if
  // we only know the campaign, not its items — picker hides in that case.
  items: Item[];
  // Optional: pre-pick a member (e.g. coming from member detail).
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

  // If the user is creating a pledge from the global pledges page, allow
  // switching campaigns. From a campaign detail page, they came in already
  // scoped — show the campaign read-only.
  const itemsForCampaign: Item[] =
    chosenCampaignId === campaignId
      ? items
      : []; // Backend has the items but we don't fetch on the fly here.

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
  }

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
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {campaigns.length > 1 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
              Campaign
            </div>
            <select
              value={chosenCampaignId}
              onChange={(e) => {
                setChosenCampaignId(e.target.value);
                setChosenItemId("");
              }}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                background: S.surfaceContainerHigh,
                border: "none",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {itemsForCampaign.length > 0 && (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
              Campaign item
            </div>
            <select
              value={chosenItemId}
              onChange={(e) => setChosenItemId(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 12,
                background: S.surfaceContainerHigh,
                border: "none",
                fontFamily: "inherit",
                fontSize: 14,
              }}
            >
              <option value="">Whole campaign</option>
              {itemsForCampaign.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
            Member
          </div>
          {chosenMember ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                background: S.surfaceContainerLow,
                borderRadius: 12,
              }}
            >
              <Avatar name={`${chosenMember.firstName} ${chosenMember.lastName}`} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {chosenMember.firstName} {chosenMember.lastName}
                </div>
                <div style={{ fontSize: 12, color: S.onSurfaceMuted }}>
                  {(chosenMember.email as string | null) ?? "no email"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMemberId("")}
                style={{
                  background: "none",
                  border: "none",
                  color: S.primary,
                  cursor: "pointer",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
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
              <div
                style={{
                  marginTop: 8,
                  maxHeight: 220,
                  overflowY: "auto",
                  border: `1px solid ${S.surfaceContainer}`,
                  borderRadius: 12,
                }}
              >
                {filteredMembers.length === 0 ? (
                  <div style={{ padding: 16, fontSize: 13, color: S.onSurfaceMuted, textAlign: "center" }}>
                    No matches
                  </div>
                ) : (
                  filteredMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMemberId(m.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: 10,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                      }}
                    >
                      <Avatar name={`${m.firstName} ${m.lastName}`} size={28} />
                      <span style={{ fontSize: 14 }}>
                        {m.firstName} {m.lastName}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: 12, color: S.onSurfaceMuted }}>
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

        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}
