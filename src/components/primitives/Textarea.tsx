import type { ChangeEventHandler } from "react";
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
	label?: string;
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
			<Label className="text-sm font-medium text-muted-foreground ml-1">
				{label}
			</Label>
		)}
		<ShadedTextarea
			value={value ?? ""}
			placeholder={placeholder}
			onChange={onChange}
			onBlur={onBlur}
			disabled={disabled}
			readOnly={readOnly}
			rows={rows}
			className={cn(
				"box-border resize-y rounded-xl border-1.5 px-3.5 py-3 text-sm text-foreground transition-all focus-visible:ring-2 focus-visible:ring-ring/20",
				disabled ? "bg-secondary opacity-60" : "bg-input",
				error ? "border-destructive ring-destructive/10" : "border-transparent",
				className,
			)}
		/>
		{helper && !error && (
			<p className="ml-1 text-sm text-muted-foreground">{helper}</p>
		)}
		{error && <p className="ml-1 text-sm text-destructive">{error}</p>}
	</div>
);
