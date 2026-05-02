"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import {
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Select as ShadedSelect,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SelectOption = {
	value: string;
	label: string;
};

export type SelectProps = {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	placeholder?: string;
	disabled?: boolean;
	hint?: string;
	size?: "sm" | "md";
	showEmptyOption?: boolean;
	emptyOptionLabel?: string;
	className?: string;
};

export const Select = ({
	label,
	value,
	onChange,
	options,
	placeholder = "Select an option",
	disabled,
	hint,
	size = "md",
	showEmptyOption,
	emptyOptionLabel,
	className,
}: SelectProps) => {
	return (
		<div
			className={cn(
				"flex flex-col gap-2",
				size === "md" && "w-full",
				className,
			)}
		>
			{label && (
				<Label className="text-[13px] font-medium text-muted-foreground ml-1">
					{label}
				</Label>
			)}

			<ShadedSelect
				value={value}
				onValueChange={(v) => onChange(v || "")}
				disabled={disabled}
			>
				<SelectTrigger
					className={cn(
						"rounded-xl border-1.5 px-3.5 transition-all focus:ring-2 focus:ring-ring/20 bg-input border-transparent",
						size === "sm" ? "h-9 text-xs min-w-[140px]" : "h-11 w-full",
						disabled && "bg-secondary opacity-60",
						!value && "text-muted-foreground",
					)}
				>
					<SelectValue placeholder={placeholder}>
						{options.find((opt) => opt.value === value)?.label}
					</SelectValue>
				</SelectTrigger>
				<SelectContent
					className="rounded-xl border-border/40 shadow-xl min-w-[200px]"
					alignItemWithTrigger={false}
					sideOffset={4}
				>
					{showEmptyOption && (
						<SelectItem
							value=""
							className="cursor-pointer rounded-lg mx-1 my-0.5 text-muted-foreground italic"
						>
							{emptyOptionLabel || placeholder}
						</SelectItem>
					)}
					{options.map((opt) => (
						<SelectItem
							key={opt.value}
							value={opt.value}
							className="cursor-pointer rounded-lg mx-1 my-0.5"
						>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</ShadedSelect>

			{hint && <p className="ml-1 text-[12px] text-muted-foreground">{hint}</p>}
		</div>
	);
};
