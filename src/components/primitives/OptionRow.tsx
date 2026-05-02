"use client";

import { cn } from "@/lib/utils";
import { Pressable } from "./Pressable";

export type OptionRowProps = {
	label: string;
	description?: string;
	active?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
};

export const OptionRow = ({
	label,
	description,
	active,
	disabled,
	onClick,
	className,
}: OptionRowProps) => (
	<Pressable
		disabled={disabled}
		onClick={onClick}
		className={cn(
			"flex w-full items-center gap-2.5 rounded-[10px] px-3.5 py-2.5 duration-150",
			active ? "bg-accent" : "bg-muted",
			className,
		)}
	>
		<span
			className={cn(
				"grid size-4 shrink-0 place-items-center rounded-full border-[1.5px]",
				active ? "border-primary" : "border-muted-foreground/40",
			)}
		>
			{active && <span className="size-2 rounded-full bg-primary" />}
		</span>
		<div className="min-w-0 flex-1">
			<div className="text-sm font-medium text-foreground">{label}</div>
			{description && (
				<div className="text-xs text-muted-foreground">{description}</div>
			)}
		</div>
	</Pressable>
);
