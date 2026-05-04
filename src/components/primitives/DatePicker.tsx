"use client";

import { CalendarIcon } from "lucide-react";
import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

export type DatePickerProps = {
	/** ISO date string (YYYY-MM-DD) or empty string */
	value?: string;
	onChange?: (value: string) => void;
	onBlur?: () => void;
	label?: string;
	placeholder?: string;
	error?: string;
	helper?: string;
	disabled?: boolean;
	/** Earliest selectable date */
	minDate?: Date;
	/** Latest selectable date */
	maxDate?: Date;
	className?: string;
};

/**
 * DatePicker — a styled date-picker that uses shadcn Calendar + Popover.
 * Value is kept as "YYYY-MM-DD" (ISO string) to align with backend date fields.
 */
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
	const [open, setOpen] = React.useState(false);

	// Parse the ISO string → Date for the calendar
	const selected = React.useMemo(() => {
		if (!value) {
			return undefined;
		}
		const parsed = dayjs(value, "YYYY-MM-DD", true);
		return parsed.isValid() ? parsed.toDate() : undefined;
	}, [value]);

	const displayLabel = selected
		? dayjs(selected).format("MMM D, YYYY")
		: undefined;

	const handleSelect = (day: Date | undefined) => {
		if (!day) {
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
									"bg-card",
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
					className="w-auto p-0"
				>
					<Calendar
						mode="single"
						selected={selected}
						onSelect={handleSelect}
						defaultMonth={selected}
						disabled={(day) => {
							if (minDate && day < minDate) {
								return true;
							}
							if (maxDate && day > maxDate) {
								return true;
							}
							return false;
						}}
						initialFocus
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
