"use client";

import { CalendarIcon, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { Calendar, type CalendarRange } from "./Calendar";
import { Pressable } from "./Pressable";

export type DateRangeValue = {
	from?: string; // ISO date string YYYY-MM-DD
	to?: string; // ISO date string YYYY-MM-DD
};

export type DateRangePreset = {
	label: string;
	// Resolver returning the range as YYYY-MM-DD strings. Called when the
	// user clicks the preset; the result is fed to `onChange` and the
	// popover is closed.
	resolve: () => DateRangeValue;
};

export type DateRangePresetsOption =
	| "default" // the built-in set below (Today, Yesterday, Last 7 days, …)
	| false // no sidebar — calendar only
	| DateRangePreset[];

export type DateRangePickerProps = {
	value?: DateRangeValue;
	onChange?: (value: DateRangeValue) => void;
	onBlur?: () => void;
	label?: string;
	placeholder?: string;
	error?: string;
	helper?: string;
	disabled?: boolean;
	minDate?: Date;
	maxDate?: Date;
	className?: string;
	// `"default"` shows the built-in preset list. Pass an explicit array
	// for a custom set, or `false` to hide the sidebar entirely.
	presets?: DateRangePresetsOption;
	// `"md"` (default) — form-row height. `"sm"` — compact, used in list-
	// page toolbars where it sits alongside an h-9 search input.
	size?: "sm" | "md";
	// Renders the trigger with `w-auto` so it sizes to the label rather
	// than stretching. Useful in toolbars.
	autoWidth?: boolean;
	// Show a clear (×) affordance on the trigger when a value is set.
	clearable?: boolean;
};

const fmt = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");

export const DEFAULT_DATE_RANGE_PRESETS: DateRangePreset[] = [
	{
		label: "Today",
		resolve: () => {
			const t = dayjs().startOf("day");
			return { from: fmt(t), to: fmt(t) };
		},
	},
	{
		label: "This week",
		resolve: () => {
			// dayjs's startOf("week") is Sunday by default — matches the
			// calendar's default `weekStartsOn`.
			const now = dayjs();
			return {
				from: fmt(now.startOf("week")),
				to: fmt(now.endOf("week")),
			};
		},
	},
	{
		label: "Last week",
		resolve: () => {
			const w = dayjs().subtract(1, "week");
			return { from: fmt(w.startOf("week")), to: fmt(w.endOf("week")) };
		},
	},
	{
		label: "This month",
		resolve: () => ({
			from: fmt(dayjs().startOf("month")),
			to: fmt(dayjs().endOf("month")),
		}),
	},
	{
		label: "Last month",
		resolve: () => {
			const m = dayjs().subtract(1, "month");
			return { from: fmt(m.startOf("month")), to: fmt(m.endOf("month")) };
		},
	},
	{
		label: "This year",
		resolve: () => ({
			from: fmt(dayjs().startOf("year")),
			to: fmt(dayjs().endOf("year")),
		}),
	},
];

const resolvePresets = (
	option: DateRangePresetsOption,
): DateRangePreset[] | null => {
	if (option === false) {
		return null;
	}
	if (option === "default" || option === undefined) {
		return DEFAULT_DATE_RANGE_PRESETS;
	}
	return option;
};

// Range date-picker. Values flow as `{ from, to }` ISO 8601 date strings
// (`YYYY-MM-DD`). Optional left-rail of presets — pass `presets={false}`
// for a calendar-only picker, or a custom array to override the
// built-in set.
export const DateRangePicker = ({
	value,
	onChange,
	onBlur,
	label,
	placeholder = "Pick a date range",
	error,
	helper,
	disabled,
	minDate,
	maxDate,
	className,
	presets = "default",
	size = "md",
	autoWidth = false,
	clearable = false,
}: DateRangePickerProps) => {
	const [open, setOpen] = useState(false);
	const resolvedPresets = resolvePresets(presets);

	const selectedRange: CalendarRange = useMemo(() => {
		if (!value) {
			return {};
		}
		const fromParsed = value.from
			? dayjs(value.from, "YYYY-MM-DD", true)
			: undefined;
		const toParsed = value.to ? dayjs(value.to, "YYYY-MM-DD", true) : undefined;
		return {
			from: fromParsed?.isValid() ? fromParsed.toDate() : undefined,
			to: toParsed?.isValid() ? toParsed.toDate() : undefined,
		};
	}, [value]);

	const displayLabel = useMemo(() => {
		if (!selectedRange.from) {
			return undefined;
		}
		const f = dayjs(selectedRange.from);
		if (selectedRange.to) {
			const t = dayjs(selectedRange.to);
			if (f.isSame(t, "day")) {
				return f.format("MMM D, YYYY");
			}
			if (f.year() === t.year()) {
				return `${f.format("MMM D")} – ${t.format("MMM D, YYYY")}`;
			}
			return `${f.format("MMM D, YYYY")} – ${t.format("MMM D, YYYY")}`;
		}
		return f.format("MMM D, YYYY");
	}, [selectedRange]);

	const handleChange = (next: Date | CalendarRange | undefined) => {
		if (!next || next instanceof Date) {
			return;
		}
		const out: DateRangeValue = {
			from: next.from ? fmt(dayjs(next.from)) : undefined,
			to: next.to ? fmt(dayjs(next.to)) : undefined,
		};
		onChange?.(out);
		if (out.from && out.to) {
			setOpen(false);
			onBlur?.();
		}
	};

	const applyPreset = (preset: DateRangePreset) => {
		const next = preset.resolve();
		onChange?.(next);
		setOpen(false);
		onBlur?.();
	};

	const isPresetActive = (preset: DateRangePreset) => {
		if (!value?.from || !value?.to) {
			return false;
		}
		const candidate = preset.resolve();
		return candidate.from === value.from && candidate.to === value.to;
	};

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			{label && (
				<Label className="text-[13px] font-medium text-on-surface-variant">
					{label}
				</Label>
			)}

			<Popover open={open} onOpenChange={setOpen}>
				<div className={cn("relative", autoWidth ? "inline-block" : "w-full")}>
					<PopoverTrigger
						disabled={disabled}
						className={cn(
							"group flex cursor-pointer items-center gap-2 rounded-xl border-1.5 border-transparent text-left text-sm transition-all focus-visible:outline-none",
							size === "sm" ? "h-9 px-3" : "h-11 px-4 gap-2.5",
							autoWidth ? "w-auto" : "w-full",
							// Reserve room for the clear button so the label never sits
							// underneath it.
							clearable && displayLabel && !disabled && "pr-8",
							disabled
								? "bg-secondary cursor-not-allowed shadow-[inset_0_0_0_1px_var(--color-input)]"
								: [
										"bg-card",
										error
											? "shadow-[inset_0_0_0_2px_var(--color-destructive)]"
											: "shadow-[inset_0_0_0_1px_var(--color-input)] hover:shadow-[inset_0_0_0_1px_var(--color-muted-foreground)] focus-visible:shadow-[inset_0_0_0_2px_var(--color-ring)]",
									],
						)}
					>
						<CalendarIcon
							size={size === "sm" ? 14 : 15}
							className={cn(
								"shrink-0",
								displayLabel ? "text-foreground" : "text-muted-foreground",
							)}
						/>
						<span
							className={cn(
								"truncate",
								autoWidth ? "" : "flex-1",
								displayLabel ? "text-foreground" : "text-muted-foreground",
							)}
						>
							{displayLabel ?? placeholder}
						</span>
					</PopoverTrigger>
					{clearable && displayLabel && !disabled && (
						// Sibling, not child, of the trigger — HTML forbids nesting
						// <button> inside <button>.
						<Pressable
							onClick={(e) => {
								e.stopPropagation();
								onChange?.({ from: undefined, to: undefined });
							}}
							className="absolute right-2 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
						>
							<X size={12} />
						</Pressable>
					)}
				</div>

				<PopoverContent
					align="start"
					side="bottom"
					sideOffset={6}
					className="w-auto p-0"
				>
					<div className="flex">
						{resolvedPresets && (
							<div className="flex flex-col gap-0.5 border-r border-border/60 p-2">
								{resolvedPresets.map((preset) => (
									<Pressable
										key={preset.label}
										onClick={() => applyPreset(preset)}
										className={cn(
											"rounded-md px-3 py-1.5 text-sm transition-colors",
											isPresetActive(preset)
												? "bg-primary/10 font-medium text-foreground"
												: "text-muted-foreground hover:bg-muted hover:text-foreground",
										)}
									>
										{preset.label}
									</Pressable>
								))}
							</div>
						)}
						<div className="p-3">
							<Calendar
								mode="range"
								value={selectedRange}
								onChange={handleChange}
								defaultMonth={selectedRange.from}
								minDate={minDate}
								maxDate={maxDate}
							/>
						</div>
					</div>
				</PopoverContent>
			</Popover>

			{helper && !error && (
				<p className="text-xs text-muted-foreground">{helper}</p>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
};
