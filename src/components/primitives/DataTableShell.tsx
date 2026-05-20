"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import {
	DataTable,
	type DataTableColumn,
	type DataTablePagination,
} from "./DataTable";
import { FilterMenu, type FilterMenuFilter } from "./FilterMenu";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { Select, type SelectOption } from "./Select";
import { StateFilter, type StateFilterValue } from "./StateFilter";

// ─────────────────────────────────────────────────────────────────────────────
// DataTableShell — the unified list-page surface.
//
// A single rounded-2xl card that owns:
//   1. Toolbar  → search input + custom filters dropdown + state filter
//                 + page-specific trailing slot (e.g. Reset, New button)
//   2. Stats    → optional text strip (124 total · 102 active · …)
//   3. Table    → rendered via `<DataTable surface="embedded" />`
//   4. Footer   → page-size select + "Showing X–Y of N" + page navigator
//
// Pages used to compose three loose components (Filters / StatsBar / Table)
// joined only by margin; this primitive collapses them into one visual
// surface so list pages feel cohesive. Each subsystem is opt-in — only the
// table + rows are required.
// ─────────────────────────────────────────────────────────────────────────────

export type DataTableShellStat = {
	label: string;
	value: ReactNode;
	/** Optional emphasis. Default neutral; "success" tints the number. */
	tone?: "neutral" | "success" | "warning" | "danger";
};

export type DataTableShellPagination = {
	total: number;
	offset: number;
	limit: number;
	onOffsetChange: (offset: number) => void;
	/** When provided, the footer renders a "N per page" select. */
	onLimitChange?: (limit: number) => void;
	/** Default: [10, 20, 50, 100]. */
	pageSizes?: number[];
};

export type DataTableShellProps<Row> = {
	/** Search input — debounced 250ms internally. Omit to hide the search. */
	search?: {
		value: string;
		onChange: (value: string) => void;
		placeholder?: string;
		/** Override the 250ms debounce window. */
		debounceMs?: number;
	};
	/** Filters rendered inside the "Filters" popover. */
	filters?: FilterMenuFilter[];
	/** Extra content inside the filters popover (above the select list). */
	filtersExtra?: ReactNode;
	/** Called when the popover's "Clear all" is pressed. */
	onClearFilters?: () => void;
	/** State (active / deleted / all) filter on the right. */
	state?: { value: StateFilterValue; onChange: (v: StateFilterValue) => void };
	/** Page-specific trailing toolbar slot (Reset chip, secondary action…). */
	toolbar?: ReactNode;

	/** Text-strip stats between toolbar and table. */
	stats?: DataTableShellStat[];

	/** Same column / row API as `DataTable`. */
	columns: DataTableColumn<Row>[];
	rows: Row[] | undefined;
	rowKey: (row: Row) => string;
	loading?: boolean;
	loadingRows?: number;
	emptyTitle?: string;
	emptySubtitle?: string;
	emptyAction?: ReactNode;
	onRowClick?: (row: Row) => void;
	rowClassName?: (row: Row) => string | undefined;

	pagination?: DataTableShellPagination;
	className?: string;
};

const TONE_CLASS: Record<NonNullable<DataTableShellStat["tone"]>, string> = {
	neutral: "text-foreground",
	success: "text-emerald-600",
	warning: "text-amber-600",
	danger: "text-destructive",
};

export const DataTableShell = <Row,>({
	search,
	filters,
	filtersExtra,
	onClearFilters,
	state,
	toolbar,
	stats,
	columns,
	rows,
	rowKey,
	loading,
	loadingRows,
	emptyTitle,
	emptySubtitle,
	emptyAction,
	onRowClick,
	rowClassName,
	pagination,
	className,
}: DataTableShellProps<Row>) => {
	const hasToolbar = Boolean(search || filters?.length || state || toolbar);

	// Adapter: shell exposes `onOffsetChange` for symmetry with `onLimitChange`,
	// but DataTable's `DataTablePagination` uses the legacy `onChange` name.
	const dataTablePagination: DataTablePagination | undefined = pagination
		? {
				total: pagination.total,
				offset: pagination.offset,
				limit: pagination.limit,
				onChange: pagination.onOffsetChange,
			}
		: undefined;

	return (
		<div
			className={cn(
				"flex flex-col rounded-2xl bg-card shadow-[inset_0_0_0_1px_var(--color-border)]",
				className,
			)}
		>
			{hasToolbar && (
				<Toolbar
					search={search}
					filters={filters}
					filtersExtra={filtersExtra}
					onClearFilters={onClearFilters}
					state={state}
					toolbar={toolbar}
				/>
			)}

			{stats && stats.length > 0 && (
				<div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border/40 px-5 py-2.5 text-sm text-muted-foreground">
					{stats.map((s) => (
						<span key={s.label} className="inline-flex items-baseline gap-1">
							<strong
								className={cn(
									"font-semibold tabular-nums",
									TONE_CLASS[s.tone ?? "neutral"],
								)}
							>
								{s.value}
							</strong>
							<span>{s.label}</span>
						</span>
					))}
				</div>
			)}

			<div
				className={cn(
					"overflow-visible",
					(hasToolbar || (stats && stats.length > 0)) &&
						"border-t border-border/40",
				)}
			>
				<DataTable
					surface="embedded"
					columns={columns}
					rows={rows}
					rowKey={rowKey}
					loading={loading}
					loadingRows={loadingRows}
					emptyTitle={emptyTitle}
					emptySubtitle={emptySubtitle}
					emptyAction={emptyAction}
					onRowClick={onRowClick}
					rowClassName={rowClassName}
					pagination={dataTablePagination}
				/>
			</div>

			{pagination && (
				<PaginationFooter pagination={pagination} loading={loading} />
			)}
		</div>
	);
};

// ─────────────────────────────────────────────────────────────────────────────
// Toolbar
// ─────────────────────────────────────────────────────────────────────────────

const Toolbar = <Row,>({
	search,
	filters,
	filtersExtra,
	onClearFilters,
	state,
	toolbar,
}: Pick<
	DataTableShellProps<Row>,
	"search" | "filters" | "filtersExtra" | "onClearFilters" | "state" | "toolbar"
>) => {
	return (
		<div className="flex flex-wrap items-center gap-2.5 p-3">
			{search && <SearchInput {...search} />}

			<FilterMenu
				filters={filters ?? []}
				extraContent={filtersExtra}
				onClearAll={onClearFilters}
			/>

			{toolbar}

			{state && (
				<div className="ml-auto">
					<StateFilter value={state.value} onChange={state.onChange} />
				</div>
			)}
		</div>
	);
};

// Local search input — debounces its own value before lifting upward so
// callers can drop the result straight into their data hook.
const SearchInput = ({
	value,
	onChange,
	placeholder = "Search…",
	debounceMs = 250,
}: NonNullable<DataTableShellProps<unknown>["search"]>) => {
	const [local, setLocal] = useState(value);
	const debounced = useDebouncedValue(local, debounceMs);

	// Push the debounced value upward.
	useEffect(() => {
		if (debounced !== value) {
			onChange(debounced);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [debounced, value, onChange]);

	// Stay in sync when the parent resets the value externally (e.g. Reset).
	useEffect(() => {
		setLocal(value);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	return (
		<div className="relative min-w-[200px] max-w-[320px] flex-1">
			<Icon
				name="search"
				size={16}
				className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
			/>
			<input
				type="text"
				value={local}
				placeholder={placeholder}
				onChange={(e) => setLocal(e.target.value)}
				className={cn(
					"h-9 w-full rounded-xl border-1.5 border-transparent bg-card dark:bg-muted pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground",
					"shadow-[inset_0_0_0_1px_var(--color-input)] outline-none transition-all",
					"hover:shadow-[inset_0_0_0_1px_var(--color-muted-foreground)] focus:shadow-[inset_0_0_0_2px_var(--color-ring)]",
				)}
			/>
			{local && (
				<Pressable
					onClick={() => setLocal("")}
					className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
				>
					<Icon name="x" size={14} />
				</Pressable>
			)}
		</div>
	);
};

// ─────────────────────────────────────────────────────────────────────────────
// Pagination footer — always rendered when `pagination` is passed.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];

const PaginationFooter = ({
	pagination,
	loading,
}: {
	pagination: DataTableShellPagination;
	loading?: boolean;
}) => {
	const {
		total,
		offset,
		limit,
		onOffsetChange,
		onLimitChange,
		pageSizes = DEFAULT_PAGE_SIZES,
	} = pagination;

	const page = Math.floor(offset / limit) + 1;
	const pages = Math.max(1, Math.ceil(total / limit));
	const first = total === 0 ? 0 : offset + 1;
	const last = Math.min(total, offset + limit);

	const goto = (p: number) =>
		onOffsetChange(Math.max(0, (Math.min(Math.max(p, 1), pages) - 1) * limit));

	const visible: number[] = [];
	for (let p = 1; p <= pages; p++) {
		if (p === 1 || p === pages || Math.abs(p - page) <= 1) {
			visible.push(p);
		}
	}

	const pageSizeOptions: SelectOption[] = pageSizes.map((n) => ({
		value: String(n),
		label: String(n),
	}));

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/40 px-5 py-2.5">
			<div className="flex items-center gap-3 text-sm text-muted-foreground">
				{onLimitChange && (
					<div className="flex items-center gap-2">
						<Select
							size="sm"
							value={String(limit)}
							onChange={(v) => {
								const next = Number(v);
								onLimitChange(next);
								// Re-anchor the offset to the start of the page that
								// contained the previous first row. Keeps the user near
								// where they were rather than jumping to page 1.
								onOffsetChange(Math.floor(offset / next) * next);
							}}
							options={pageSizeOptions}
							className="w-auto"
						/>
						<span>per page</span>
					</div>
				)}
				<span className="tabular-nums">
					{loading ? (
						"Loading…"
					) : (
						<>
							Showing <span className="text-foreground">{first}</span>–
							<span className="text-foreground">{last}</span> of{" "}
							<span className="text-foreground">{total}</span>
						</>
					)}
				</span>
			</div>

			<div className="flex items-center gap-2">
				<Button
					role="secondary"
					size="sm"
					disabled={page <= 1}
					onClick={() => goto(page - 1)}
					className="h-8 w-8 p-0"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				<div className="flex items-center gap-1.5">
					{visible.map((p, i) => {
						const prev = visible[i - 1];
						const gap = prev != null && p - prev > 1;
						return (
							<div key={p} className="flex items-center gap-1.5">
								{gap && (
									<span className="px-1 text-xs text-muted-foreground">
										...
									</span>
								)}
								<Button
									role={p === page ? "primary" : "secondary"}
									size="sm"
									onClick={() => goto(p)}
									className={cn(
										"h-8 min-w-[32px] px-2 text-xs",
										p !== page && "bg-transparent border-none hover:bg-muted",
									)}
								>
									{p}
								</Button>
							</div>
						);
					})}
				</div>

				<Button
					role="secondary"
					size="sm"
					disabled={page >= pages}
					onClick={() => goto(page + 1)}
					className="h-8 w-8 p-0"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
};
