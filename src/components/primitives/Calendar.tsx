"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { Pressable } from "./Pressable";

export type CalendarRange = { from?: Date; to?: Date };

export type CalendarProps = {
	mode?: "single" | "range";
	// Selection. `single` reads/writes `Date | undefined`; `range` reads/
	// writes `{ from?: Date; to?: Date }`. The two are mutually exclusive
	// — pass whichever matches `mode`.
	value?: Date | CalendarRange;
	onChange?: (value: Date | CalendarRange | undefined) => void;
	// View bounds (inclusive). Days outside the range are not selectable
	// and rendered with reduced opacity.
	minDate?: Date;
	maxDate?: Date;
	// Initial month to display. Defaults to today, or to the `value`'s
	// month when `value` is set.
	defaultMonth?: Date;
	// Day-of-week to start the week. 0 = Sunday, 1 = Monday. Defaults to 0.
	weekStartsOn?: 0 | 1;
	className?: string;
};

type View = "day" | "month" | "year";

const WEEKDAYS_SUN = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAYS_MON = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

const isRange = (value: unknown): value is CalendarRange =>
	typeof value === "object" &&
	value !== null &&
	!(value instanceof Date) &&
	("from" in (value as object) || "to" in (value as object));

const asDate = (value: Date | CalendarRange | undefined): Date | undefined => {
	if (!value) {
		return undefined;
	}
	return value instanceof Date ? value : undefined;
};

const asRange = (value: Date | CalendarRange | undefined): CalendarRange => {
	if (!value) {
		return {};
	}
	return isRange(value) ? value : {};
};

const outOfBounds = (day: dayjs.Dayjs, minDate?: Date, maxDate?: Date) => {
	if (minDate && day.isBefore(dayjs(minDate), "day")) {
		return true;
	}
	if (maxDate && day.isAfter(dayjs(maxDate), "day")) {
		return true;
	}
	return false;
};

// Custom dayjs-based calendar primitive with three views (day / month /
// year). Drives `DatePicker` and `DateRangePicker`; you usually want one
// of those rather than this directly. Internally avoids react-day-picker
// so we can render month and year grids without fighting the API.
export const Calendar = ({
	mode = "single",
	value,
	onChange,
	minDate,
	maxDate,
	defaultMonth,
	weekStartsOn = 0,
	className,
}: CalendarProps) => {
	const selectedDate = asDate(value);
	const selectedRange = asRange(value);

	const anchor = useMemo(() => {
		if (defaultMonth) {
			return dayjs(defaultMonth).startOf("month");
		}
		if (selectedDate) {
			return dayjs(selectedDate).startOf("month");
		}
		if (selectedRange.from) {
			return dayjs(selectedRange.from).startOf("month");
		}
		return dayjs().startOf("month");
	}, [defaultMonth, selectedDate, selectedRange.from]);

	const [cursor, setCursor] = useState(anchor);
	const [view, setView] = useState<View>("day");

	// Re-anchor when the externally-supplied value moves to a different
	// month (e.g. a preset click on the range picker).
	useEffect(() => {
		setCursor(anchor);
	}, [anchor]);

	const weekdays = weekStartsOn === 1 ? WEEKDAYS_MON : WEEKDAYS_SUN;

	const handlePickDay = (day: dayjs.Dayjs) => {
		if (outOfBounds(day, minDate, maxDate)) {
			return;
		}
		if (mode === "single") {
			onChange?.(day.toDate());
			return;
		}
		// Range mode: first click sets from + clears to; second click
		// completes the range (swapping if the user clicked earlier).
		const { from, to } = selectedRange;
		if (!from || (from && to)) {
			onChange?.({ from: day.toDate(), to: undefined });
			return;
		}
		const fromD = dayjs(from);
		if (day.isBefore(fromD, "day")) {
			onChange?.({ from: day.toDate(), to: from });
		} else {
			onChange?.({ from, to: day.toDate() });
		}
	};

	const handlePickMonth = (monthIndex: number) => {
		setCursor(cursor.month(monthIndex));
		setView("day");
	};

	const handlePickYear = (year: number) => {
		setCursor(cursor.year(year));
		setView("month");
	};

	const prev = () => {
		if (view === "day") {
			setCursor(cursor.subtract(1, "month"));
		} else if (view === "month") {
			setCursor(cursor.subtract(1, "year"));
		} else {
			setCursor(cursor.subtract(12, "year"));
		}
	};
	const next = () => {
		if (view === "day") {
			setCursor(cursor.add(1, "month"));
		} else if (view === "month") {
			setCursor(cursor.add(1, "year"));
		} else {
			setCursor(cursor.add(12, "year"));
		}
	};

	const headerLabel =
		view === "day"
			? cursor.format("MMMM YYYY")
			: view === "month"
				? cursor.format("YYYY")
				: `${cursor.year() - (cursor.year() % 12)} – ${cursor.year() - (cursor.year() % 12) + 11}`;

	return (
		<div className={cn("w-[268px] select-none", className)}>
			<div className="flex items-center justify-between px-1 pb-2">
				<Pressable
					onClick={prev}
					className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<ChevronLeft size={16} />
				</Pressable>
				<Pressable
					onClick={() => {
						if (view === "day") {
							setView("month");
						} else if (view === "month") {
							setView("year");
						}
					}}
					className="rounded-md px-2.5 py-1 text-sm font-medium hover:bg-muted"
				>
					{headerLabel}
				</Pressable>
				<Pressable
					onClick={next}
					className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					<ChevronRight size={16} />
				</Pressable>
			</div>

			{view === "day" && (
				<DayGrid
					cursor={cursor}
					weekdays={weekdays}
					weekStartsOn={weekStartsOn}
					mode={mode}
					selectedDate={selectedDate}
					selectedRange={selectedRange}
					minDate={minDate}
					maxDate={maxDate}
					onPick={handlePickDay}
				/>
			)}
			{view === "month" && (
				<MonthGrid
					cursor={cursor}
					minDate={minDate}
					maxDate={maxDate}
					selectedMonthIndex={
						selectedDate && cursor.year() === dayjs(selectedDate).year()
							? dayjs(selectedDate).month()
							: undefined
					}
					onPick={handlePickMonth}
				/>
			)}
			{view === "year" && (
				<YearGrid
					cursor={cursor}
					minDate={minDate}
					maxDate={maxDate}
					selectedYear={selectedDate ? dayjs(selectedDate).year() : undefined}
					onPick={handlePickYear}
				/>
			)}
		</div>
	);
};

type DayGridProps = {
	cursor: dayjs.Dayjs;
	weekdays: string[];
	weekStartsOn: 0 | 1;
	mode: "single" | "range";
	selectedDate?: Date;
	selectedRange: CalendarRange;
	minDate?: Date;
	maxDate?: Date;
	onPick: (day: dayjs.Dayjs) => void;
};

const DayGrid = ({
	cursor,
	weekdays,
	weekStartsOn,
	mode,
	selectedDate,
	selectedRange,
	minDate,
	maxDate,
	onPick,
}: DayGridProps) => {
	const firstOfMonth = cursor.startOf("month");
	const leadOffset = (firstOfMonth.day() - weekStartsOn + 7) % 7;
	const gridStart = firstOfMonth.subtract(leadOffset, "day");

	const days = useMemo(() => {
		return Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));
	}, [gridStart]);

	const today = dayjs().startOf("day");
	const from = selectedRange.from ? dayjs(selectedRange.from) : undefined;
	const to = selectedRange.to ? dayjs(selectedRange.to) : undefined;

	return (
		<>
			<div className="grid grid-cols-7 px-1 pb-1">
				{weekdays.map((d, idx) => (
					<div
						// biome-ignore lint/suspicious/noArrayIndexKey: weekday positions are stable
						key={idx}
						className="flex h-8 items-center justify-center text-[11px] font-medium text-muted-foreground"
					>
						{d}
					</div>
				))}
			</div>
			<div className="grid grid-cols-7 gap-y-0.5 px-1">
				{days.map((day) => {
					const inCurrentMonth = day.month() === cursor.month();
					const isToday = day.isSame(today, "day");
					const disabled = outOfBounds(day, minDate, maxDate);
					const singleSelected =
						mode === "single" &&
						selectedDate &&
						day.isSame(dayjs(selectedDate), "day");

					let inRange = false;
					let isRangeStart = false;
					let isRangeEnd = false;
					if (mode === "range" && from) {
						if (to) {
							inRange =
								day.isSameOrAfter(from, "day") && day.isSameOrBefore(to, "day");
							isRangeStart = day.isSame(from, "day");
							isRangeEnd = day.isSame(to, "day");
						} else {
							isRangeStart = day.isSame(from, "day");
						}
					}

					const isEndpoint = singleSelected || isRangeStart || isRangeEnd;
					const isMiddle = inRange && !isEndpoint;
					// Range start/end with a partner on the other side gets a
					// half-fill "track" behind the endpoint circle so the bar
					// flows continuously into the middle cells. Single-day
					// ranges (from === to) get no track.
					const trackSide: "full" | "left" | "right" | "none" = isMiddle
						? "full"
						: isRangeStart && to && !isRangeEnd
							? "right"
							: isRangeEnd && from && !isRangeStart
								? "left"
								: "none";

					return (
						<Pressable
							key={day.toISOString()}
							disabled={disabled}
							onClick={() => onPick(day)}
							className={cn(
								"group relative flex h-9 items-center justify-center text-[13px]",
								disabled && "pointer-events-none opacity-30",
							)}
						>
							{trackSide !== "none" && (
								<span
									aria-hidden
									className={cn(
										"absolute inset-y-1 bg-primary/10",
										trackSide === "full" && "inset-x-0",
										trackSide === "right" && "left-1/2 right-0",
										trackSide === "left" && "left-0 right-1/2",
									)}
								/>
							)}
							<span
								aria-hidden
								className={cn(
									"absolute inset-y-0.5 left-1/2 -translate-x-1/2 aspect-square rounded-full transition-colors",
									isEndpoint
										? "bg-primary"
										: !isMiddle && inCurrentMonth && !disabled
											? "group-hover:bg-muted"
											: "",
								)}
							/>
							<span
								className={cn(
									"relative z-10 font-medium",
									isEndpoint && "text-primary-foreground",
									!isEndpoint && !isMiddle && !inCurrentMonth && "font-normal text-muted-foreground/40",
									!isEndpoint && !isMiddle && inCurrentMonth && "text-foreground",
									isMiddle && "text-foreground",
								)}
							>
								{day.date()}
							</span>
							{isToday && !isEndpoint && !isMiddle && (
								<span
									aria-hidden
									className="absolute bottom-1 left-1/2 z-10 h-0.5 w-1.5 -translate-x-1/2 rounded-full bg-primary"
								/>
							)}
						</Pressable>
					);
				})}
			</div>
		</>
	);
};

type MonthGridProps = {
	cursor: dayjs.Dayjs;
	minDate?: Date;
	maxDate?: Date;
	selectedMonthIndex?: number;
	onPick: (monthIndex: number) => void;
};

const MonthGrid = ({
	cursor,
	minDate,
	maxDate,
	selectedMonthIndex,
	onPick,
}: MonthGridProps) => {
	const year = cursor.year();
	return (
		<div className="grid grid-cols-3 gap-2 p-2">
			{MONTH_NAMES.map((name, idx) => {
				const monthEnd = dayjs().year(year).month(idx).endOf("month");
				const monthStart = dayjs().year(year).month(idx).startOf("month");
				const disabled =
					(minDate && monthEnd.isBefore(dayjs(minDate), "day")) ||
					(maxDate && monthStart.isAfter(dayjs(maxDate), "day"));
				const selected = selectedMonthIndex === idx;
				return (
					<Pressable
						key={name}
						disabled={disabled}
						onClick={() => onPick(idx)}
						className={cn(
							"flex h-12 items-center justify-center rounded-md text-sm transition-colors",
							selected
								? "bg-primary font-medium text-primary-foreground"
								: "hover:bg-muted",
							disabled && "pointer-events-none opacity-30",
						)}
					>
						{name}
					</Pressable>
				);
			})}
		</div>
	);
};

type YearGridProps = {
	cursor: dayjs.Dayjs;
	minDate?: Date;
	maxDate?: Date;
	selectedYear?: number;
	onPick: (year: number) => void;
};

const YearGrid = ({
	cursor,
	minDate,
	maxDate,
	selectedYear,
	onPick,
}: YearGridProps) => {
	const decadeStart = cursor.year() - (cursor.year() % 12);
	return (
		<div className="grid grid-cols-3 gap-2 p-2">
			{Array.from({ length: 12 }, (_, i) => decadeStart + i).map((year) => {
				const disabled =
					(minDate && year < dayjs(minDate).year()) ||
					(maxDate && year > dayjs(maxDate).year());
				const selected = selectedYear === year;
				return (
					<Pressable
						key={year}
						disabled={disabled}
						onClick={() => onPick(year)}
						className={cn(
							"flex h-12 items-center justify-center rounded-md text-sm transition-colors",
							selected
								? "bg-primary font-medium text-primary-foreground"
								: "hover:bg-muted",
							disabled && "pointer-events-none opacity-30",
						)}
					>
						{year}
					</Pressable>
				);
			})}
		</div>
	);
};
