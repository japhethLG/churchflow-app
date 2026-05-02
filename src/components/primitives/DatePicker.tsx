"use client";

import * as React from "react";
import dayjs from "@/lib/dayjs";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
    if (!value) return undefined;
    const parsed = dayjs(value, "YYYY-MM-DD", true);
    return parsed.isValid() ? parsed.toDate() : undefined;
  }, [value]);

  const displayLabel = selected
    ? dayjs(selected).format("MMM D, YYYY")
    : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (!day) return;
    onChange?.(dayjs(day).format("YYYY-MM-DD"));
    setOpen(false);
    onBlur?.();
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
            // Match Input shell styling exactly
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
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            defaultMonth={selected}
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
