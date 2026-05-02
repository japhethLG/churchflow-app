"use client";

import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import { Pressable } from "./Pressable";

export type IconCardProps = {
	label: string;
	icon?: IconName;
	active?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
};

export const IconCard = ({
	label,
	icon,
	active,
	disabled,
	onClick,
	className,
}: IconCardProps) => (
	<Pressable
		disabled={disabled}
		onClick={onClick}
		className={cn(
			"rounded-xl border-[1.5px] px-2 py-3 text-center",
			active
				? "border-primary bg-accent text-primary"
				: "border-transparent bg-muted text-secondary-foreground",
			className,
		)}
	>
		{icon && (
			<div className="mb-1 grid place-items-center">
				<Icon name={icon} size={18} />
			</div>
		)}
		<div className="text-[11px] font-medium">{label}</div>
	</Pressable>
);
