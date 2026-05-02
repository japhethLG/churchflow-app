import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import { Pressable } from "./Pressable";

export const Chip = ({
	children,
	active,
	icon,
	onClick,
	className,
}: {
	children: ReactNode;
	active?: boolean;
	icon?: IconName;
	onClick?: () => void;
	className?: string;
}) => (
	<Pressable
		onClick={onClick}
		className={cn(
			"inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium",
			active
				? "bg-foreground text-background"
				: "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
			className,
		)}
	>
		{icon && (
			<Icon
				name={icon}
				size={14}
				className={cn(active ? "text-background" : "text-muted-foreground")}
			/>
		)}
		{children}
	</Pressable>
);
