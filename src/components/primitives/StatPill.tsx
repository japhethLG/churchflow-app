import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const StatPill = ({
	label,
	value,
	className,
}: {
	label: string;
	value: ReactNode;
	className?: string;
}) => {
	return (
		<div
			className={cn(
				"flex items-center gap-1.5 rounded-full bg-input px-3.5 py-1.5 text-xs font-sans border border-border/40",
				className,
			)}
		>
			<span className="text-muted-foreground whitespace-nowrap">{label}:</span>
			<span className="font-semibold text-foreground">{value}</span>
		</div>
	);
};
