"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { Chip, Input } from "@/components/primitives";
import type { components } from "@/lib/api";

type Campaign = components["schemas"]["CampaignResponseDto"];

export type PledgeStatusFilter = "all" | "ACTIVE" | "FULFILLED" | "CANCELLED";

export type PledgesFiltersValue = {
  campaignId: string | "all";
  status: PledgeStatusFilter;
  search: string;
};

const STATUS_LABEL: Record<PledgeStatusFilter, string> = {
  all: "Status: All",
  ACTIVE: "Status: Active",
  FULFILLED: "Status: Fulfilled",
  CANCELLED: "Status: Cancelled",
};

const STATUS_CYCLE: PledgeStatusFilter[] = ["all", "ACTIVE", "FULFILLED", "CANCELLED"];

function next<T>(arr: readonly T[], v: T): T {
  const i = arr.indexOf(v);
  return arr[(i + 1) % arr.length];
}

export function PledgesFilters({
  value,
  campaigns,
  onChange,
}: {
  value: PledgesFiltersValue;
  campaigns: Campaign[];
  onChange: (v: PledgesFiltersValue) => void;
}) {
  const campaignLabel =
    value.campaignId === "all"
      ? "Campaign: All"
      : `Campaign: ${campaigns.find((c) => c.id === value.campaignId)?.title ?? "…"}`;

  function cycleCampaign() {
    const ids: (string | "all")[] = ["all", ...campaigns.map((c) => c.id)];
    onChange({ ...value, campaignId: next(ids, value.campaignId) });
  }

  return (
    <div
      style={{
        background: S.surfaceContainerLow,
        borderRadius: 16,
        padding: 12,
        display: "flex",
        gap: 10,
        alignItems: "center",
        marginBottom: 16,
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: 1, maxWidth: 320, minWidth: 200 }}>
        <Input
          icon="search"
          placeholder="Search by note…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <span onClick={cycleCampaign}>
        <Chip icon="chevronDown" active={value.campaignId !== "all"}>
          {campaignLabel}
        </Chip>
      </span>
      <span onClick={() => onChange({ ...value, status: next(STATUS_CYCLE, value.status) })}>
        <Chip icon="chevronDown" active={value.status !== "all"}>
          {STATUS_LABEL[value.status]}
        </Chip>
      </span>
    </div>
  );
}
