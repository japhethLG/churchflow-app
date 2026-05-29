// ─────────────────────────────────────────────────────────────────────────────
// Unified table-filter model — the single declarative description of a list
// page's filters, consumed by BOTH the desktop <DataTableShell> and the mobile
// <DataTableShellMobile>. One list of typed filters replaces the old split of
// `filters` (selects) + `state` + `dateRange` props, so a new filter kind is
// added in exactly one place and both renderers pick it up.
//
//   select  → desktop: a <Select> in the Filters popover · mobile: chip group
//   date    → desktop: a <DateRangePicker> in the toolbar  · mobile: calendar
//   state   → desktop: the <StateFilter> segmented control · mobile: "Records"
//
// Pure model only (types + derivation helpers) — no JSX, no React — so it can
// be shared without pulling either renderer into the other.
// ─────────────────────────────────────────────────────────────────────────────

import type { DateRangeValue } from "./DateRangePicker";
import type { SelectOption } from "./Select";
import type { StateFilterValue } from "./StateFilter";

type TableFilterBase = {
	key: string;
	label: string;
};

/** A single-select dropdown filter (status, type, campaign, …). */
export type TableSelectFilter = TableFilterBase & {
	kind: "select";
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	/**
	 * Value treated as "no filter" — when `value === defaultValue` the filter
	 * is inactive (not counted, no chip). Defaults to `"all"`.
	 */
	defaultValue?: string;
};

/** A from/to date-range filter. */
export type TableDateFilter = TableFilterBase & {
	kind: "date";
	value: DateRangeValue;
	onChange: (value: DateRangeValue) => void;
};

/**
 * The 3-state archive filter (active / deleted / all). `key`/`label` are fixed
 * ("state" / "Records") so callers don't repeat them; the page still owns the
 * value + `toStateFilterFlags` wiring.
 */
export type TableStateFilter = {
	kind: "state";
	value: StateFilterValue;
	onChange: (value: StateFilterValue) => void;
};

export type TableFilter =
	| TableSelectFilter
	| TableDateFilter
	| TableStateFilter;

// ─── Partition helpers (used by the renderers to place each kind) ───────────
export const selectFilters = (filters: TableFilter[]): TableSelectFilter[] =>
	filters.filter((f): f is TableSelectFilter => f.kind === "select");

export const dateFilters = (filters: TableFilter[]): TableDateFilter[] =>
	filters.filter((f): f is TableDateFilter => f.kind === "date");

export const stateFilterOf = (
	filters: TableFilter[],
): TableStateFilter | undefined =>
	filters.find((f): f is TableStateFilter => f.kind === "state");

// ─── Active-state derivation (single source of truth for both renderers) ────
export const isSelectActive = (f: TableSelectFilter): boolean =>
	f.value !== (f.defaultValue ?? "all");

/** Whether a single filter is currently narrowing the result set. */
export const isFilterActive = (f: TableFilter): boolean => {
	if (f.kind === "state") {
		return f.value !== "active";
	}
	if (f.kind === "select") {
		return isSelectActive(f);
	}
	return Boolean(f.value.from || f.value.to);
};

/** Number of active filters — drives the mobile Filters button badge. */
export const activeFilterCount = (filters: TableFilter[]): number =>
	filters.filter(isFilterActive).length;

// ─── Stats strip tone (shared by desktop + mobile) ──────────────────────────
export type TableStatTone = "neutral" | "success" | "warning" | "danger";

export const STAT_TONE_CLASS: Record<TableStatTone, string> = {
	neutral: "text-foreground",
	success: "text-emerald-600",
	warning: "text-amber-600",
	danger: "text-destructive",
};
