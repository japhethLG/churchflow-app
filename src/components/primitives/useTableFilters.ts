"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUrlFilters } from "@/lib/url-filters";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { SelectOption } from "./Select";
import {
	type StateFilterFlags,
	type StateFilterValue,
	toStateFilterFlags,
} from "./StateFilter";
import type {
	TableDateFilter,
	TableSelectFilter,
	TableStateFilter,
} from "./tableFilters";

// ─────────────────────────────────────────────────────────────────────────────
// useTableFilters — the caller-side controller for a <DataTableShell> page.
//
// Owns the flat record of filter values + pagination, and exposes builders that
// emit the shell's `TableFilter` objects already wired to reset the page offset
// on change. Replaces the per-page boilerplate (offset-reset on every onChange,
// the StateFilter wiring, the clear-all handler, the `toStateFilterFlags` spread).
//
//   const t = useTableFilters({ status: "all", state: "active", search: "" });
//   const { data } = useMembers(slug, {
//     status: t.values.status === "all" ? undefined : t.values.status,
//     search: t.values.search || undefined,
//     ...t.stateFlags(), offset: t.offset, limit: t.limit,
//   });
//   <DataTableShell
//     search={t.search("Search…")}
//     filters={[t.select("status", "Status", STATUS_OPTIONS), t.state()]}
//     onClearFilters={t.clear}
//     pagination={t.pagination(total)}
//   />
//
// Pass `{ url: true }` to deep-link the values into the URL (see useUrlFilters).
// ─────────────────────────────────────────────────────────────────────────────

export type UseTableFiltersOptions = {
	/** Back values with URL search params so filters are deep-linkable. */
	url?: boolean;
	/**
	 * Initial page size. When omitted, defaults to 20 on desktop and 10 on
	 * mobile (sub-`md`). Pass an explicit value to pin the size on every
	 * viewport.
	 */
	limit?: number;
};

export const useTableFilters = <T extends Record<string, string>>(
	defaults: T,
	options: UseTableFiltersOptions = {},
) => {
	const { url = false, limit: explicitLimit } = options;

	// Both stores are instantiated unconditionally (rules-of-hooks); `url` is a
	// constant per call site so the hook order is stable. The unused store is
	// inert — when `url` is false we never call `setUrlValues`, so the URL is
	// untouched.
	const [local, setLocal] = useState<T>(defaults);
	const [urlValues, setUrlValues] = useUrlFilters(defaults);
	const values = url ? urlValues : local;

	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(explicitLimit ?? 20);

	// Default the page size to 10 on mobile (sub-`md`) so card lists stay short,
	// while desktop keeps 20. Skipped when the caller pinned an explicit limit,
	// and applied at most once so it never clobbers a user-chosen page size.
	const isMobile = useIsMobile();
	const appliedMobileDefault = useRef(false);
	useEffect(() => {
		if (explicitLimit != null || appliedMobileDefault.current) {
			return;
		}
		if (isMobile) {
			appliedMobileDefault.current = true;
			setLimit(10);
		}
	}, [isMobile, explicitLimit]);

	// Any filter change re-anchors pagination to the first page.
	const set = useCallback(
		(next: Partial<T>) => {
			if (url) {
				setUrlValues(next);
			} else {
				setLocal((v) => ({ ...v, ...next }));
			}
			setOffset(0);
		},
		[url, setUrlValues],
	);

	const clear = useCallback(() => {
		if (url) {
			setUrlValues(defaults);
		} else {
			setLocal(defaults);
		}
		setOffset(0);
	}, [url, setUrlValues, defaults]);

	type Key = keyof T & string;

	// ── Filter builders — each emits a TableFilter wired to `set` ──────────────
	const select = (
		key: Key,
		label: string,
		options: SelectOption[],
		defaultValue = "all",
	): TableSelectFilter => ({
		kind: "select",
		key,
		label,
		value: values[key],
		onChange: (v) => set({ [key]: v } as Partial<T>),
		options,
		defaultValue,
	});

	const state = (key: Key = "state" as Key): TableStateFilter => ({
		kind: "state",
		value: (values[key] ?? "active") as StateFilterValue,
		onChange: (v) => set({ [key]: v } as Partial<T>),
	});

	const date = (
		label: string,
		keys?: { from?: Key; to?: Key },
	): TableDateFilter => {
		const fromKey = (keys?.from ?? "dateFrom") as Key;
		const toKey = (keys?.to ?? "dateTo") as Key;
		return {
			kind: "date",
			key: fromKey,
			label,
			value: {
				from: values[fromKey] || undefined,
				to: values[toKey] || undefined,
			},
			onChange: (r) =>
				set({ [fromKey]: r.from ?? "", [toKey]: r.to ?? "" } as Partial<T>),
		};
	};

	const search = (placeholder?: string, key: Key = "search" as Key) => ({
		value: values[key] ?? "",
		onChange: (v: string) => set({ [key]: v } as Partial<T>),
		placeholder,
	});

	const pagination = (total: number, opts?: { pageSizes?: number[] }) => ({
		total,
		offset,
		limit,
		onOffsetChange: setOffset,
		onLimitChange: setLimit,
		pageSizes: opts?.pageSizes,
	});

	const stateFlags = (key: Key = "state" as Key): StateFilterFlags =>
		toStateFilterFlags((values[key] ?? "active") as StateFilterValue);

	return {
		values,
		set,
		clear,
		offset,
		limit,
		setOffset,
		setLimit,
		select,
		state,
		date,
		search,
		pagination,
		stateFlags,
	};
};
