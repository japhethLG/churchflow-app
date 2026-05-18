"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// Bind a flat record of filter values to URL search params. State lives in
// the URL so other surfaces can deep-link with preselected filters (e.g.
// the Pledge Dynamics "past due" card linking to /pledges?lifecycle=past-due
// pre-filters the list).
//
// `defaults` provides BOTH the typed shape and the values to remove from
// the URL when the filter matches its default — keeps URLs short.
//
// Limitations on purpose:
//   - values are string-only (filters are usually enums or ISO dates)
//   - `replace`-style navigation (no history clutter)
//   - changes are batched in `set({ a, b })` to avoid intermediate URLs
//
// Example:
//   const [filters, setFilters] = useUrlFilters({
//     status: "all",
//     lifecycle: "all",
//     search: "",
//   });
//   // <SegmentedControl value={filters.status} onChange={(v) => setFilters({ status: v })} />
export const useUrlFilters = <T extends Record<string, string>>(
	defaults: T,
): [T, (next: Partial<T>) => void] => {
	const router = useRouter();
	const pathname = usePathname();
	const sp = useSearchParams();

	const current = useMemo(() => {
		const out = { ...defaults };
		for (const k of Object.keys(defaults) as (keyof T)[]) {
			const v = sp.get(k as string);
			if (v != null) {
				out[k] = v as T[keyof T];
			}
		}
		return out;
	}, [sp, defaults]);

	const set = useCallback(
		(next: Partial<T>) => {
			const params = new URLSearchParams(sp.toString());
			for (const [k, v] of Object.entries(next)) {
				if (v === undefined || v === null || v === "" || v === defaults[k]) {
					params.delete(k);
				} else {
					params.set(k, v as string);
				}
			}
			const qs = params.toString();
			router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
		},
		[router, pathname, sp, defaults],
	);

	return [current, set];
};

// Build a URL with the given filter params appended. Useful for outbound
// links from elsewhere ("View past-due pledges") — the destination page's
// `useUrlFilters` will read them on mount.
export const buildFilterUrl = (
	path: string,
	params: Record<string, string | undefined | null>,
): string => {
	const search = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v) {
			search.set(k, v);
		}
	}
	const qs = search.toString();
	return qs ? `${path}?${qs}` : path;
};
