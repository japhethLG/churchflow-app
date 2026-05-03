"use client";

import { cn } from "@/lib/utils";
import { Pressable } from "./Pressable";

export type OptionCardProps = {
	label: string;
	description?: string;
	active?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
};

export const OptionCard = ({
	label,
	description,
	active,
	disabled,
	onClick,
	className,
}: OptionCardProps) => (
	<Pressable
		disabled={disabled}
		onClick={onClick}
		className={cn(
			"flex-1 rounded-xl border-[1.5px] px-3.5 py-3",
			active ? "border-primary bg-card" : "border-input bg-muted",
			className,
		)}
	>
		<div
			className={cn(
				"mb-1 text-sm font-semibold",
				active ? "text-primary" : "text-foreground",
			)}
		>
			{label}
		</div>
		{description && (
			<div
				className={cn(
					"text-sm leading-snug",
					active ? "text-primary" : "text-muted-foreground",
				)}
			>
				{description}
			</div>
		)}
	</Pressable>
);
