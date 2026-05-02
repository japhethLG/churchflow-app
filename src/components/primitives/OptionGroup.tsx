"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Chip } from "./Chip";
import type { IconName } from "./Icon";
import { IconCard } from "./IconCard";
import { OptionCard } from "./OptionCard";
import { OptionRow } from "./OptionRow";
import { Pill } from "./Pill";

export type OptionGroupOption = {
	value: string;
	label: string;
	description?: string;
	icon?: IconName;
};

export type OptionGroupVariant = "pill" | "card" | "row" | "icon-card" | "chip";

export type OptionGroupProps = {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	options: OptionGroupOption[];
	variant?: OptionGroupVariant;
	columns?: number;
	hint?: string;
	error?: string;
	disabled?: boolean;
	className?: string;
};

export const OptionGroup = ({
	label,
	value,
	onChange,
	options,
	variant = "pill",
	columns,
	hint,
	error,
	disabled,
	className,
}: OptionGroupProps) => (
	<div className={cn("flex flex-col gap-2", className)}>
		{label && (
			<Label className="text-[13px] font-medium text-muted-foreground ml-1">
				{label}
			</Label>
		)}

		{variant === "pill" && (
			<div className="flex gap-2">
				{options.map((opt) => (
					<Pill
						key={opt.value}
						active={value === opt.value}
						disabled={disabled}
						onClick={() => onChange(opt.value)}
					>
						{opt.label}
					</Pill>
				))}
			</div>
		)}

		{variant === "card" && (
			<div className="flex gap-2.5">
				{options.map((opt) => (
					<OptionCard
						key={opt.value}
						label={opt.label}
						description={opt.description}
						active={value === opt.value}
						disabled={disabled}
						onClick={() => onChange(opt.value)}
					/>
				))}
			</div>
		)}

		{variant === "row" && (
			<div className="flex flex-col gap-1.5">
				{options.map((opt) => (
					<OptionRow
						key={opt.value}
						label={opt.label}
						description={opt.description}
						active={value === opt.value}
						disabled={disabled}
						onClick={() => onChange(opt.value)}
					/>
				))}
			</div>
		)}

		{variant === "chip" && (
			<div className="flex flex-wrap gap-1.5">
				{options.map((opt) => (
					<Chip
						key={opt.value}
						active={value === opt.value}
						icon={opt.icon}
						onClick={disabled ? undefined : () => onChange(opt.value)}
					>
						{opt.label}
					</Chip>
				))}
			</div>
		)}

		{variant === "icon-card" && (
			<div
				className={cn(
					"grid gap-2",
					columns ? null : "grid-cols-3 sm:grid-cols-6",
				)}
				style={
					columns
						? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
						: undefined
				}
			>
				{options.map((opt) => (
					<IconCard
						key={opt.value}
						label={opt.label}
						icon={opt.icon}
						active={value === opt.value}
						disabled={disabled}
						onClick={() => onChange(opt.value)}
					/>
				))}
			</div>
		)}

		{error ? (
			<p className="ml-1 text-[12px] text-destructive">{error}</p>
		) : (
			hint && <p className="ml-1 text-[12px] text-muted-foreground">{hint}</p>
		)}
	</div>
);
