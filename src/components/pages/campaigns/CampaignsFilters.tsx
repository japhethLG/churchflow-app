"use client";

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

const next = <T,>(arr: readonly T[], v: T): T => {
  const i = arr.indexOf(v);
  return arr[(i + 1) % arr.length];
}

export const CampaignsFilters = ({
  value,
  onChange,
}: {
  value: CampaignsFiltersValue;
  onChange: (v: CampaignsFiltersValue) => void;
}) => {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl bg-muted p-3">
      <div className="min-w-[200px] max-w-[320px] flex-1">
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
