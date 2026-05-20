import type {
	ChangeEventHandler,
	FocusEventHandler,
	HTMLInputTypeAttribute,
	KeyboardEventHandler,
	ReactNode,
} from "react";
import { Input as ShadedInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

export type InputSize = "md" | "lg";

const SHELL_BY_SIZE: Record<InputSize, string> = {
	md: "flex h-11 items-center gap-2.5 px-4",
	lg: "flex items-baseline gap-1.5 px-[18px] py-3.5",
};

const PREFIX_BY_SIZE: Record<InputSize, string> = {
	md: "text-sm text-muted-foreground shrink-0",
	lg: "text-2xl font-medium text-muted-foreground shrink-0",
};

const FIELD_BY_SIZE: Record<InputSize, string> = {
	md: "h-full text-sm",
	lg: "text-3xl font-semibold tracking-tight",
};

const READONLY_BY_SIZE: Record<InputSize, string> = {
	md: "flex-1 text-sm tabular-nums",
	lg: "flex-1 text-3xl font-semibold tracking-tight tabular-nums",
};

export const Input = ({
	label,
	icon,
	value,
	placeholder,
	helper,
	error,
	prefix,
	suffix,
	size = "md",
	fullWidth = true,
	className,
	inputClassName,
	onChange,
	onKeyDown,
	onFocus,
	onBlur,
	type = "text",
	step,
	min,
	autoFocus,
	disabled,
	readOnly,
}: {
	label?: ReactNode;
	icon?: IconName;
	value?: string;
	placeholder?: string;
	helper?: string;
	error?: string;
	prefix?: string;
	suffix?: string;
	size?: InputSize;
	fullWidth?: boolean;
	className?: string;
	inputClassName?: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
	onFocus?: FocusEventHandler<HTMLInputElement>;
	onBlur?: () => void;
	type?: HTMLInputTypeAttribute;
	step?: string;
	min?: string;
	autoFocus?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
}) => {
	const interactive = Boolean(onChange);

	return (
		<div className={cn("flex flex-col gap-2", fullWidth ? "w-full" : "w-fit")}>
			{label && (
				<Label className="text-[13px] font-medium text-on-surface-variant">
					{label}
				</Label>
			)}
			<div
				className={cn(
					"rounded-xl border-1.5 border-transparent transition-all",
					SHELL_BY_SIZE[size],
					disabled
						? "bg-secondary cursor-not-allowed shadow-[inset_0_0_0_1px_var(--color-input)]"
						: [
								"bg-card",
								error
									? "shadow-[inset_0_0_0_2px_var(--color-destructive)]"
									: "shadow-[inset_0_0_0_1px_var(--color-input)] hover:shadow-[inset_0_0_0_1px_var(--color-muted-foreground)] focus-within:shadow-[inset_0_0_0_2px_var(--color-ring)]",
							],
					className,
				)}
			>
				{icon && (
					<Icon
						name={icon}
						size={16}
						className="text-muted-foreground shrink-0"
					/>
				)}
				{prefix && <span className={PREFIX_BY_SIZE[size]}>{prefix}</span>}

				{interactive ? (
					<ShadedInput
						type={type}
						step={step}
						min={min}
						autoFocus={autoFocus}
						value={value ?? ""}
						placeholder={placeholder}
						onChange={onChange}
						onKeyDown={onKeyDown}
						onFocus={onFocus}
						onBlur={onBlur}
						disabled={disabled}
						readOnly={readOnly}
						className={cn(
							"border-none bg-transparent p-0 shadow-none outline-none focus-visible:ring-0 tabular-nums placeholder:text-muted-foreground",
							FIELD_BY_SIZE[size],
							inputClassName,
						)}
					/>
				) : (
					<span
						className={cn(
							READONLY_BY_SIZE[size],
							value ? "text-foreground" : "text-muted-foreground",
						)}
					>
						{value || placeholder}
					</span>
				)}

				{suffix && (
					<span className="text-sm text-muted-foreground shrink-0">
						{suffix}
					</span>
				)}
			</div>

			{helper && !error && (
				<p className="text-xs text-muted-foreground">{helper}</p>
			)}
			{error && <p className="text-xs text-destructive">{error}</p>}
		</div>
	);
};
