"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input, Chip } from "@/components/primitives";

export type CampaignStatusFilter = "all" | "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type CampaignsFiltersValue = {
  search: string;
  status: CampaignStatusFilter;
};

const STATUS_LABEL: Record<CampaignStatusFilter, string> = {
  all: "Status: All",
  DRAFT: "Status: Draft",
  ACTIVE: "Status: Active",
  COMPLETED: "Status: Completed",
  CANCELLED: "Status: Cancelled",
};

const STATUS_CYCLE: CampaignStatusFilter[] = ["all", "DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"];

function next<T>(arr: readonly T[], v: T): T {
  const i = arr.indexOf(v);
  return arr[(i + 1) % arr.length];
}

export function CampaignsFilters({
  value,
  onChange,
}: {
  value: CampaignsFiltersValue;
  onChange: (v: CampaignsFiltersValue) => void;
}) {
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
          placeholder="Search campaigns…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <span onClick={() => onChange({ ...value, status: next(STATUS_CYCLE, value.status) })}>
        <Chip icon="chevronDown" active={value.status !== "all"}>
          {STATUS_LABEL[value.status]}
        </Chip>
      </span>
    </div>
  );
}
