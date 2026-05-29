"use client";

import { type ReactNode, useEffect, useState } from "react";
import { BaseSheet } from "@/components/sheets/BaseSheet";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import type { DataTableShellStat } from "./DataTableShell";
import { DateRangePicker } from "./DateRangePicker";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { Select } from "./Select";
import type { StateFilterValue } from "./StateFilter";
import {
	activeFilterCount,
	STAT_TONE_CLASS,
	type TableFilter,
} from "./tableFilters";

// Record-state filter options — rendered as a Select (labeled "Record state")
// in the mobile sheet, same control vocabulary as the other filters.
const STATE_OPTIONS = [
	{ value: "active", label: "Active" },
	{ value: "deleted", label: "Deleted" },
	{ value: "all", label: "All records" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DataTableShellMobile — the sub-`md` counterpart to <DataTableShell>.
//
// The desktop shell spreads its controls across a toolbar (search + Filters
// popover + date picker + Active/Deleted/All segmented control). On mobile
// every filter collapses into ONE sheet: the toolbar shows a single Filters
// button with an active-count badge, applied filters surface as removable
// chips, and each table row becomes an expandable card (rendered by the
// page-supplied `mobileCard`).
//
// It consumes the SAME unified `TableFilter[]` the desktop shell receives, so a
// new filter kind appears in both layouts without extra wiring.
// ─────────────────────────────────────────────────────────────────────────────

export type DataTableShellMobileProps<Row> = {
	search?: {
		value: string;
		onChange: (value: string) => void;
		placeholder?: string;
		debounceMs?: number;
	};
	filters?: TableFilter[];
	onClearFilters?: () => void;
	stats?: DataTableShellStat[];

	rows: Row[] | undefined;
	rowKey: (row: Row) => string;
	mobileCard: (row: Row) => ReactNode;
	loading?: boolean;
	emptyTitle?: string;
	emptySubtitle?: string;
	emptyAction?: ReactNode;

	pagination?: {
		total: number;
		offset: number;
		limit: number;
		onOffsetChange: (offset: number) => void;
	};
	className?: string;
};

export const DataTableShellMobile = <Row,>({
	search,
	filters,
	onClearFilters,
	stats,
	rows,
	rowKey,
	mobileCard,
	loading,
	emptyTitle,
	emptySubtitle,
	emptyAction,
	pagination,
	className,
}: DataTableShellMobileProps<Row>) => {
	const [filterOpen, setFilterOpen] = useState(false);

	const all = filters ?? [];
	const filterCount = activeFilterCount(all);

	const list = rows ?? [];
	const total = pagination?.total ?? list.length;
	const shown = list.length;
	const firstIdx = pagination ? pagination.offset + 1 : 1;
	const lastIdx = pagination ? pagination.offset + shown : shown;

	return (
		<div className={cn("flex flex-col gap-3", className)}>
			{/* Toolbar — search + single Filters button */}
			<div className="flex items-center gap-2">
				{search && <MobileSearch {...search} />}
				{all.length > 0 && (
					<Pressable
						onClick={() => setFilterOpen(true)}
						className={cn(
							"flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 transition-colors",
							filterCount > 0
								? "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-primary)_45%,transparent)]"
								: "bg-card text-foreground shadow-[inset_0_0_0_1px_var(--color-input)]",
						)}
					>
						<span className="sr-only">Filters</span>
						<Icon name="filter" size={17} />
						{filterCount > 0 && (
							<span className="grid min-w-[18px] place-items-center rounded-full bg-primary px-1.5 text-[11px] font-bold tabular-nums text-primary-foreground">
								{filterCount}
							</span>
						)}
					</Pressable>
				)}
			</div>

			{/* Stats strip — horizontally scrollable to fit the desktop band */}
			{stats && stats.length > 0 && (
				<div className="no-scrollbar -mx-1 flex gap-5 overflow-x-auto px-1 py-0.5">
					{stats.map((s) => (
						<div key={s.label} className="flex shrink-0 flex-col">
							<span
								className={cn(
									"text-base font-bold tabular-nums leading-tight tracking-tight",
									STAT_TONE_CLASS[s.tone ?? "neutral"],
								)}
							>
								{s.value}
							</span>
							<span className="whitespace-nowrap text-[10.5px] text-muted-foreground">
								{s.label}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Cards */}
			{loading ? (
				<div className="flex flex-col gap-2.5">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: fixed skeleton placeholders
							key={i}
							className="h-[72px] animate-pulse rounded-2xl bg-card shadow-card"
						/>
					))}
				</div>
			) : list.length === 0 ? (
				<div className="rounded-2xl bg-card p-8 text-center shadow-card">
					<p className="text-sm font-semibold text-foreground">
						{emptyTitle ?? "Nothing here yet"}
					</p>
					{emptySubtitle && (
						<p className="mt-1 text-sm text-muted-foreground">
							{emptySubtitle}
						</p>
					)}
					{emptyAction && <div className="mt-4">{emptyAction}</div>}
				</div>
			) : (
				<div className="flex flex-col gap-2.5">
					{list.map((row) => (
						<div key={rowKey(row)}>{mobileCard(row)}</div>
					))}
				</div>
			)}

			{/* Footer */}
			{pagination && list.length > 0 && (
				<MobileFooter
					first={firstIdx}
					last={lastIdx}
					total={total}
					offset={pagination.offset}
					limit={pagination.limit}
					onOffsetChange={pagination.onOffsetChange}
				/>
			)}

			{/* Consolidated filter sheet */}
			{all.length > 0 && (
				<ListFilterSheet
					open={filterOpen}
					onClose={() => setFilterOpen(false)}
					filters={all}
					filterCount={filterCount}
					onClearAll={() => onClearFilters?.()}
				/>
			)}
		</div>
	);
};

// ─── Mobile search ──────────────────────────────────────────────────────────
const MobileSearch = ({
	value,
	onChange,
	placeholder = "Search…",
	debounceMs = 250,
}: NonNullable<DataTableShellMobileProps<unknown>["search"]>) => {
	const [local, setLocal] = useState(value);
	const debounced = useDebouncedValue(local, debounceMs);

	useEffect(() => {
		if (debounced !== value) {
			onChange(debounced);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced, value, onChange]);

	useEffect(() => {
		setLocal(value);
	}, [value]);

	return (
		<div className="relative min-w-0 flex-1">
			<Icon
				name="search"
				size={16}
				className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
			/>
			<input
				type="text"
				value={local}
				placeholder={placeholder}
				onChange={(e) => setLocal(e.target.value)}
				className={cn(
					"h-10 w-full rounded-xl bg-card pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground",
					"shadow-[inset_0_0_0_1px_var(--color-input)] outline-none transition-shadow",
					"focus:shadow-[inset_0_0_0_2px_var(--color-ring)]",
				)}
			/>
			{local && (
				<Pressable
					onClick={() => setLocal("")}
					className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
				>
					<Icon name="x" size={14} />
				</Pressable>
			)}
		</div>
	);
};

// ─── Footer ──────────────────────────────────────────────────────────────────
const MobileFooter = ({
	first,
	last,
	total,
	offset,
	limit,
	onOffsetChange,
}: {
	first: number;
	last: number;
	total: number;
	offset: number;
	limit: number;
	onOffsetChange: (offset: number) => void;
}) => {
	const page = Math.floor(offset / limit) + 1;
	const pages = Math.max(1, Math.ceil(total / limit));

	return (
		<div className="flex items-center justify-between px-1 pt-1">
			<span className="text-xs tabular-nums text-muted-foreground">
				Showing{" "}
				<strong className="font-semibold text-foreground">
					{first}–{last}
				</strong>{" "}
				of <strong className="font-semibold text-foreground">{total}</strong>
			</span>
			<div className="flex items-center gap-1.5">
				<Pressable
					onClick={() => onOffsetChange(Math.max(0, offset - limit))}
					disabled={page <= 1}
					className="grid size-8 place-items-center rounded-lg bg-card text-muted-foreground shadow-[inset_0_0_0_1px_var(--color-input)] disabled:opacity-40"
				>
					<Icon name="chevronLeft" size={15} />
				</Pressable>
				<span className="grid h-8 min-w-8 place-items-center rounded-lg bg-primary px-2 text-sm font-bold tabular-nums text-primary-foreground">
					{page}
				</span>
				<Pressable
					onClick={() => onOffsetChange(offset + limit)}
					disabled={page >= pages}
					className="grid size-8 place-items-center rounded-lg bg-card text-muted-foreground shadow-[inset_0_0_0_1px_var(--color-input)] disabled:opacity-40"
				>
					<Icon name="chevronRight" size={15} />
				</Pressable>
			</div>
		</div>
	);
};

// ─── Filter sheet ──────────────────────────────────────────────────────────
// Every filter renders as a Select (or the date picker), not chips — a long
// option list stays a tidy dropdown instead of a wall of pills.
const ListFilterSheet = ({
	open,
	onClose,
	filters,
	filterCount,
	onClearAll,
}: {
	open: boolean;
	onClose: () => void;
	filters: TableFilter[];
	filterCount: number;
	onClearAll: () => void;
}) => {
	return (
		<BaseSheet
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					onClose();
				}
			}}
			onOpenChangeComplete={() => {}}
			title="Filters"
			description={filterCount > 0 ? `${filterCount} active` : undefined}
			snapPoints={[0.6, 0.94]}
			initialSnap={0}
			footer={
				// Filters apply live; the sheet is dismissed via the header close or
				// backdrop. The only footer action is clearing — shown when relevant.
				filterCount > 0 ? (
					<Button
						role="secondary"
						recipe="ghost"
						onClick={onClearAll}
						fullWidth
					>
						Clear all filters
					</Button>
				) : undefined
			}
		>
			{filters.map((f) => {
				// Record state — the Active/Deleted/All control, as a Select.
				if (f.kind === "state") {
					return (
						<div key="state" className="mb-5">
							<Select
								label="Record state"
								value={f.value}
								onChange={(v) => f.onChange(v as StateFilterValue)}
								options={STATE_OPTIONS}
							/>
						</div>
					);
				}
				// Date range — a popover picker (same as the record-gift sheet),
				// presets drilling down on top of the calendar.
				if (f.kind === "date") {
					return (
						<div key={f.key} className="mb-5">
							<DateRangePicker
								label={f.label}
								value={f.value}
								onChange={f.onChange}
								presets="default"
								presetsLayout="drilldown"
								clearable
							/>
						</div>
					);
				}
				// Select filter (status / type / campaign / lifecycle).
				return (
					<div key={f.key} className="mb-5">
						<Select
							label={f.label}
							value={f.value}
							onChange={f.onChange}
							options={f.options}
						/>
					</div>
				);
			})}
		</BaseSheet>
	);
};
