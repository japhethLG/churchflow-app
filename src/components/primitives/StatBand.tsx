"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatBandItem = {
	label: string;
	value: ReactNode;
	// Optional small caption under the value (e.g. "vs. last month +12%").
	caption?: ReactNode;
};

export type StatBandProps = {
	items: StatBandItem[];
	className?: string;
	size?: "sm" | "md";
	/**
	 * On narrow screens (< `sm`), wrap into this many columns instead of the
	 * single horizontal divided row — which overflows for 4+ items. Leave
	 * unset to keep the divided row at every width (fine for ≤3 short items).
	 */
	mobileColumns?: 2 | 3;
};

const VALUE_CLASS = {
	sm: "text-lg",
	md: "text-2xl",
} as const;

const MOBILE_COLS_CLASS = {
	2: "grid-cols-2",
	3: "grid-cols-3",
} as const;

// Horizontal row of stats with hairline dividers, no card chrome.
// Place inside an existing `Card` (or directly on the page) as the
// header for an entity detail. With `mobileColumns`, it reflows into a
// gridded set of cells below `sm` rather than overflowing.
export const StatBand = ({
	items,
	className,
	size = "md",
	mobileColumns,
}: StatBandProps) => {
	if (items.length === 0) {
		return null;
	}

	const cell = (it: StatBandItem, idx: number, withGutter: boolean) => (
		<div
			key={`${it.label}-${idx}`}
			className={cn(withGutter && "px-4 first:pl-0 last:pr-0")}
		>
			<dt className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
				{it.label}
			</dt>
			<dd
				className={cn(
					"mt-1 font-bold tabular-nums tracking-tight text-foreground",
					VALUE_CLASS[size],
				)}
			>
				{it.value}
			</dd>
			{it.caption && (
				<div className="mt-0.5 text-xs text-muted-foreground">{it.caption}</div>
			)}
		</div>
	);

	const horizontal = (
		<dl
			className={cn(
				"grid items-stretch divide-x divide-border",
				mobileColumns && "hidden sm:grid",
				className,
			)}
			style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
		>
			{items.map((it, idx) => cell(it, idx, true))}
		</dl>
	);

	if (!mobileColumns) {
		return horizontal;
	}

	return (
		<>
			{/* Mobile: a wrapping grid of plain cells (dividers don't read on a
			    wrapped grid, so they're dropped here). */}
			<dl
				className={cn(
					"grid gap-x-6 gap-y-5 sm:hidden",
					MOBILE_COLS_CLASS[mobileColumns],
					className,
				)}
			>
				{items.map((it, idx) => cell(it, idx, false))}
			</dl>
			{horizontal}
		</>
	);
};
