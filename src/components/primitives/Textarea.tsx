import type { ChangeEventHandler, ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Textarea as ShadedTextarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Textarea = ({
	label,
	value,
	placeholder,
	helper,
	error,
	rows = 3,
	fullWidth = true,
	className,
	onChange,
	onBlur,
	disabled,
	readOnly,
}: {
	label?: ReactNode;
	value?: string;
	placeholder?: string;
	helper?: string;
	error?: string;
	rows?: number;
	fullWidth?: boolean;
	className?: string;
	onChange?: ChangeEventHandler<HTMLTextAreaElement>;
	onBlur?: () => void;
	disabled?: boolean;
	readOnly?: boolean;
}) => (
	<div className={cn("flex flex-col gap-2", fullWidth ? "w-full" : "w-fit")}>
		{label && (
			<Label className="text-[13px] font-medium text-on-surface-variant">
				{label}
			</Label>
		)}
		<div
			className={cn(
				"rounded-xl border-1.5 border-transparent transition-all",
				disabled
					? "bg-secondary cursor-not-allowed shadow-[inset_0_0_0_1px_var(--color-input)]"
					: [
							"bg-card dark:bg-muted",
							error
								? "shadow-[inset_0_0_0_2px_var(--color-destructive)]"
								: "shadow-[inset_0_0_0_1px_var(--color-input)] hover:shadow-[inset_0_0_0_1px_var(--color-muted-foreground)] focus-within:shadow-[inset_0_0_0_2px_var(--color-ring)]",
						],
				className,
			)}
		>
			<ShadedTextarea
				value={value ?? ""}
				placeholder={placeholder}
				onChange={onChange}
				onBlur={onBlur}
				disabled={disabled}
				readOnly={readOnly}
				rows={rows}
				className="w-full resize-y border-none dark:border-none bg-transparent dark:bg-transparent px-3.5 py-3 text-sm text-foreground shadow-none dark:shadow-none outline-none focus-visible:ring-0 placeholder:text-muted-foreground"
			/>
		</div>
		{helper && !error && (
			<p className="text-xs text-muted-foreground">{helper}</p>
		)}
		{error && <p className="text-xs text-destructive">{error}</p>}
	</div>
);
