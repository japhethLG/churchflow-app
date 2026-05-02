"use client";

import { Input } from "./Input";

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

// Large currency-prefixed number input. Thin preset over `Input` with size="lg".
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
	<Input
		label={label}
		size="lg"
		type="number"
		prefix={currency}
		placeholder={placeholder}
		step={step}
		min={min}
		autoFocus={autoFocus}
		disabled={disabled}
		helper={hint}
		error={error}
		value={value}
		onChange={(e) => onChange(e.target.value)}
		onBlur={onBlur}
		className={className}
	/>
);
