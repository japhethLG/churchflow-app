"use client";

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
				<Label className="text-[13px] font-medium text-on-surface-variant">
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
						"rounded-xl border-1.5 border-transparent px-4 transition-all",
						size === "sm" ? "h-9 text-xs min-w-[140px]" : "h-11! w-full",
						disabled
							? "bg-secondary cursor-not-allowed shadow-[inset_0_0_0_1px_var(--color-input)]"
							: "bg-card shadow-[inset_0_0_0_1px_var(--color-input)] hover:shadow-[inset_0_0_0_1px_var(--color-muted-foreground)] data-[state=open]:shadow-[inset_0_0_0_2px_var(--color-ring)]",
						!value && "text-muted-foreground",
					)}
				>
					<SelectValue placeholder={placeholder}>
						{options.find((opt) => opt.value === value)?.label}
					</SelectValue>
				</SelectTrigger>
				<SelectContent
					className="rounded-lg border-border/40 shadow-xl min-w-[200px]"
					alignItemWithTrigger={false}
					sideOffset={4}
				>
					{showEmptyOption && (
						<SelectItem
							value=""
							className="cursor-pointer rounded-none mx-1 py-2 text-muted-foreground italic focus:bg-muted focus:text-foreground"
						>
							{emptyOptionLabel || placeholder}
						</SelectItem>
					)}
					{options.map((opt) => (
						<SelectItem
							key={opt.value}
							value={opt.value}
							className="cursor-pointer rounded-none mx-1 py-2 focus:bg-muted focus:text-foreground"
						>
							{opt.label}
						</SelectItem>
					))}
				</SelectContent>
			</ShadedSelect>

			{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
		</div>
	);
};
