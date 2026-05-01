"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type DateRangeValue = {
  from?: string; // ISO date string YYYY-MM-DD
  to?: string;   // ISO date string YYYY-MM-DD
};

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
  /** Number of months to show at once */
  numberOfMonths?: number;
};

/**
 * DateRangePicker — A premium date range picker using shadcn Calendar + Popover.
 * Values are stored as { from: string, to: string } in YYYY-MM-DD format.
 */
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
  numberOfMonths = 2,
}: DateRangePickerProps) => {
  const [open, setOpen] = React.useState(false);

  // Parse strings back to Dates for the calendar
  const selectedRange: DateRange | undefined = React.useMemo(() => {
    if (!value) return undefined;
    const from = value.from ? parse(value.from, "yyyy-MM-dd", new Date()) : undefined;
    const to = value.to ? parse(value.to, "yyyy-MM-dd", new Date()) : undefined;
    
    return {
      from: from && isValid(from) ? from : undefined,
      to: to && isValid(to) ? to : undefined,
    };
  }, [value]);

  const displayLabel = React.useMemo(() => {
    if (!selectedRange?.from) return undefined;
    if (selectedRange.to) {
      return `${format(selectedRange.from, "MMM d")} – ${format(
        selectedRange.to,
        "MMM d, yyyy",
      )}`;
    }
    return format(selectedRange.from, "MMM d, yyyy");
  }, [selectedRange]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      onChange?.({ from: undefined, to: undefined });
      return;
    }

    const newValue: DateRangeValue = {
      from: range.from ? format(range.from, "yyyy-MM-dd") : undefined,
      to: range.to ? format(range.to, "yyyy-MM-dd") : undefined,
    };

    onChange?.(newValue);
    
    // Close only when both are picked or if it's a re-selection
    if (newValue.from && newValue.to) {
      setOpen(false);
      onBlur?.();
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label className="ml-1 text-[13px] font-medium text-muted-foreground">
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border-1.5 bg-input px-3.5 text-left text-[14.5px] transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
            error ? "border-destructive ring-destructive/10" : "border-transparent",
            disabled && "cursor-not-allowed opacity-60",
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
            mode="range"
            selected={selectedRange}
            onSelect={handleSelect}
            numberOfMonths={numberOfMonths}
            disabled={(day) => {
              if (minDate && day < minDate) return true;
              if (maxDate && day > maxDate) return true;
              return false;
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {helper && !error && (
        <p className="ml-1 text-[12px] text-muted-foreground">{helper}</p>
      )}
      {error && <p className="ml-1 text-[12px] text-destructive">{error}</p>}
    </div>
  );
};
