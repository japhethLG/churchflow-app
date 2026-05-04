"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type AmountInputProps = {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	currency?: string;
	placeholder?: string;
	step?: string;
	min?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	hint?: string;
	error?: string;
	className?: string;
};

export const AmountInput = ({
	label,
	value,
	onChange,
	onBlur,
	currency,
	placeholder = "0.00",
	step = "0.01",
	min = "0",
	autoFocus,
	disabled,
	hint,
	error,
	className,
}: AmountInputProps) => (
	<div className={cn("flex w-full flex-col gap-2", className)}>
		{label && (
			<Label className="text-[13px] font-medium text-on-surface-variant">
				{label}
			</Label>
		)}
		<div
			className={cn(
				"flex items-baseline gap-2 rounded-[14px] px-5 py-[18px] transition-all",
				disabled
					? "cursor-not-allowed bg-secondary"
					: [
							"bg-muted",
							error
								? "shadow-[inset_0_0_0_2px_var(--color-destructive)]"
								: "focus-within:shadow-[inset_0_0_0_2px_var(--color-ring)]",
						],
			)}
		>
			{currency && (
				<span className="shrink-0 select-none text-[20px] font-medium leading-none text-muted-foreground">
					{currency}
				</span>
			)}
			<input
				type="number"
				step={step}
				min={min}
				// biome-ignore lint/a11y/noAutofocus: controlled by consumer
				autoFocus={autoFocus}
				value={value ?? ""}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value)}
				onBlur={onBlur}
				disabled={disabled}
				className="min-w-0 flex-1 bg-transparent outline-none font-features-['tnum'] text-[32px] font-semibold leading-none tracking-[-0.02em] text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
			/>
		</div>
		{hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
		{error && <p className="text-xs text-destructive">{error}</p>}
	</div>
);
