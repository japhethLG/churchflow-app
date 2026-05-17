"use client";

import { type ReactNode, useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { Select, type SelectOption } from "./Select";

// One filter row inside the popover. The caller controls value/onChange;
// the popover just renders the labeled control and counts non-default
// filters toward the trigger's badge.
export type FilterMenuFilter = {
	key: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	/**
	 * Value treated as "no filter" — when `value === defaultValue` this
	 * filter is not counted toward the active badge. Defaults to `"all"`.
	 */
	defaultValue?: string;
};

export type FilterMenuProps = {
	filters: FilterMenuFilter[];
	/** Optional extra content rendered above the filter list — e.g. a date-range picker that doesn't fit the select pattern. */
	extraContent?: ReactNode;
	/** Called when "Clear all" is pressed; should reset every filter to its `defaultValue`. */
	onClearAll?: () => void;
	/** Override the trigger label. Default: "Filters". */
	triggerLabel?: string;
	className?: string;
};

const isActive = (f: FilterMenuFilter): boolean =>
	f.value !== (f.defaultValue ?? "all");

export const FilterMenu = ({
	filters,
	extraContent,
	onClearAll,
	triggerLabel = "Filters",
	className,
}: FilterMenuProps) => {
	const [open, setOpen] = useState(false);
	const activeCount = filters.filter(isActive).length;
	const hasActive = activeCount > 0;

	if (filters.length === 0 && !extraContent) {
		return null;
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<button
						type="button"
						className={cn(
							"inline-flex h-9 items-center gap-2 rounded-xl border-1.5 border-transparent bg-card px-3.5 text-sm font-medium text-foreground transition-all",
							"shadow-[inset_0_0_0_1px_var(--color-input)] hover:shadow-[inset_0_0_0_1px_var(--color-muted-foreground)]",
							hasActive &&
								"shadow-[inset_0_0_0_1.5px_var(--color-ring)] text-foreground",
							className,
						)}
					>
						<Icon name="filter" size={14} className="text-muted-foreground" />
						<span>{triggerLabel}</span>
						{hasActive && (
							<span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular-nums">
								{activeCount}
							</span>
						)}
						<Icon
							name="chevronDown"
							size={14}
							className="text-muted-foreground"
						/>
					</button>
				}
			/>
			<PopoverContent
				align="start"
				sideOffset={6}
				className="w-[280px] p-0 gap-0"
			>
				<div className="flex flex-col gap-3 p-3">
					{extraContent}
					{filters.map((f) => (
						<div key={f.key} className="flex flex-col gap-1.5">
							<span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
								{f.label}
							</span>
							<Select
								size="sm"
								value={f.value}
								onChange={f.onChange}
								options={f.options}
							/>
						</div>
					))}
				</div>

				{onClearAll && (
					<div className="flex items-center justify-between border-t border-border/40 px-3 py-2">
						<Pressable
							onClick={() => {
								onClearAll();
							}}
							disabled={!hasActive}
							className={cn(
								"text-xs font-medium",
								hasActive
									? "text-foreground hover:text-primary"
									: "text-muted-foreground cursor-not-allowed",
							)}
						>
							Clear all
						</Pressable>
						<Pressable
							onClick={() => setOpen(false)}
							className="text-xs font-medium text-muted-foreground hover:text-foreground"
						>
							Done
						</Pressable>
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
};
