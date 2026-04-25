"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { Chip, Input } from "@/components/primitives";
import type { components } from "@/lib/api";

type TransactionType = components["schemas"]["TransactionResponseDto"]["type"];
type Campaign = components["schemas"]["CampaignResponseDto"];

export type TransactionTypeFilter = "all" | TransactionType;

export type DateRangeFilter =
  | "all"
  | "today"
  | "this-month"
  | "last-month"
  | "ytd";

export type TransactionsFiltersValue = {
  search: string;
  type: TransactionTypeFilter;
  range: DateRangeFilter;
  campaignId: string | "all";
};

const TYPE_LABEL: Record<TransactionTypeFilter, string> = {
  all: "All types",
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

const RANGE_LABEL: Record<DateRangeFilter, string> = {
  all: "All time",
  today: "Today",
  "this-month": "This month",
  "last-month": "Last month",
  ytd: "Year to date",
};

const TYPE_CYCLE: TransactionTypeFilter[] = [
  "all",
  "TITHE",
  "OFFERING",
  "MISSION_GIVING",
  "FIRST_FRUIT",
  "COMMITMENT",
  "DONATION",
  "OTHER",
];
const RANGE_CYCLE: DateRangeFilter[] = ["all", "today", "this-month", "last-month", "ytd"];

function next<T>(arr: readonly T[], v: T): T {
  const i = arr.indexOf(v);
  return arr[(i + 1) % arr.length];
}

export function TransactionsFilters({
  value,
  campaigns,
  onChange,
  onReset,
}: {
  value: TransactionsFiltersValue;
  campaigns: Campaign[];
  onChange: (v: TransactionsFiltersValue) => void;
  onReset: () => void;
}) {
  const campaignLabel =
    value.campaignId === "all"
      ? "All campaigns"
      : campaigns.find((c) => c.id === value.campaignId)?.title ?? "Campaign";

  function cycleCampaign() {
    const ids: (string | "all")[] = ["all", ...campaigns.map((c) => c.id)];
    onChange({ ...value, campaignId: next(ids, value.campaignId) });
  }

  const isFiltered =
    value.search.trim().length > 0 ||
    value.type !== "all" ||
    value.range !== "all" ||
    value.campaignId !== "all";

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
          placeholder="Search note or reference #…"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <span onClick={() => onChange({ ...value, range: next(RANGE_CYCLE, value.range) })}>
        <Chip icon="calendar" active={value.range !== "all"}>
          {RANGE_LABEL[value.range]}
        </Chip>
      </span>
      <span onClick={() => onChange({ ...value, type: next(TYPE_CYCLE, value.type) })}>
        <Chip icon="chevronDown" active={value.type !== "all"}>
          {TYPE_LABEL[value.type]}
        </Chip>
      </span>
      <span onClick={cycleCampaign}>
        <Chip icon="chevronDown" active={value.campaignId !== "all"}>
          {campaignLabel}
        </Chip>
      </span>
      {isFiltered && (
        <span
          onClick={onReset}
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: S.onSurfaceMuted,
            cursor: "pointer",
            padding: "0 8px",
          }}
        >
          Reset filters
        </span>
      )}
    </div>
  );
}

// Resolve a `DateRangeFilter` to ISO strings the backend accepts.
export function resolveRange(range: DateRangeFilter): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const startOf = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const startOfMonth = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const startOfYear = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  switch (range) {
    case "today": {
      return { dateFrom: startOf(now).toISOString() };
    }
    case "this-month": {
      return { dateFrom: startOfMonth(now).toISOString() };
    }
    case "last-month": {
      const start = startOfMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)));
      const end = startOfMonth(now);
      return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
    }
    case "ytd": {
      return { dateFrom: startOfYear(now).toISOString() };
    }
    default:
      return {};
  }
}
