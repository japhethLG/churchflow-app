"use client";

import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { Calendar } from "./Calendar";

export type DatePickerProps = {
	// ISO date string (YYYY-MM-DD) or empty string.
	value?: string;
	onChange?: (value: string) => void;
	onBlur?: () => void;
	label?: string;
	placeholder?: string;
	error?: string;
	helper?: string;
	disabled?: boolean;
	minDate?: Date;
	maxDate?: Date;
	className?: string;
};

// Styled date-picker. Value is stored as "YYYY-MM-DD" — the wire format
// for date-only backend fields. Time-of-day callers should reach for the
// (range) picker and convert at the boundary.
export const DatePicker = ({
	value,
	onChange,
	onBlur,
	label,
	placeholder = "Pick a date",
	error,
	helper,
	disabled,
	minDate,
	maxDate,
	className,
}: DatePickerProps) => {
	const [open, setOpen] = useState(false);

	const selected = useMemo(() => {
		if (!value) {
			return undefined;
		}
		const parsed = dayjs(value, "YYYY-MM-DD", true);
		return parsed.isValid() ? parsed.toDate() : undefined;
	}, [value]);

	const displayLabel = selected
		? dayjs(selected).format("MMM D, YYYY")
		: undefined;

	const handleChange = (day: Date | { from?: Date; to?: Date } | undefined) => {
		if (!day || !(day instanceof Date)) {
			return;
		}
		onChange?.(dayjs(day).format("YYYY-MM-DD"));
		setOpen(false);
		onBlur?.();
	};

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			{label && (
				<Label className="text-[13px] font-medium text-on-surface-variant">
					{label}
				</Label>
			)}

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					disabled={disabled}
					className={cn(
						"flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border-1.5 border-transparent px-4 text-left text-sm transition-all focus-visible:outline-none",
						disabled
							? "bg-secondary cursor-not-allowed shadow-[inset_0_0_0_1px_var(--color-input)]"
							: [
									"bg-card dark:bg-muted",
									error
										? "shadow-[inset_0_0_0_2px_var(--color-destructive)]"
										: "shadow-[inset_0_0_0_1px_var(--color-input)] hover:shadow-[inset_0_0_0_1px_var(--color-muted-foreground)] focus-visible:shadow-[inset_0_0_0_2px_var(--color-ring)]",
								],
					)}
				>
					<CalendarIcon
						size={15}
						className={cn(
							"shrink-0",
							displayLabel ? "text-foreground" : "text-muted-foreground",
						)}
					/>
					<span
						className={cn(
							"flex-1 truncate",
							displayLabel ? "text-foreground" : "text-muted-foreground",
						)}
					>
						{displayLabel ?? placeholder}
					</span>
				</PopoverTrigger>

				<PopoverContent
					align="start"
					side="bottom"
					sideOffset={6}
					className="w-auto p-3"
				>
					<Calendar
						mode="single"
						value={selected}
						onChange={handleChange}
						defaultMonth={selected}
						minDate={minDate}
						maxDate={maxDate}
					/>
				</PopoverContent>
			</Popover>

			{helper && !error && (
				<p className="text-xs text-muted-foreground">{helper}</p>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
};
