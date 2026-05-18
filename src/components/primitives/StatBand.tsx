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
};

const VALUE_CLASS = {
	sm: "text-lg",
	md: "text-2xl",
} as const;

// Horizontal row of stats with hairline dividers, no card chrome.
// Place inside an existing `Card` (or directly on the page) as the
// header for an entity detail.
export const StatBand = ({ items, className, size = "md" }: StatBandProps) => {
	if (items.length === 0) {
		return null;
	}
	return (
		<dl
			className={cn("grid items-stretch divide-x divide-border", className)}
			style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
		>
			{items.map((it, idx) => (
				<div key={`${it.label}-${idx}`} className="px-4 first:pl-0 last:pr-0">
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
						<div className="mt-0.5 text-xs text-muted-foreground">
							{it.caption}
						</div>
					)}
				</div>
			))}
		</dl>
	);
};
