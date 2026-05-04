import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";
import { Pressable } from "./Pressable";

export type ChipType = "filter" | "choice" | "input" | "destructive";

export const Chip = ({
	children,
	active,
	icon,
	onClick,
	onDismiss,
	type = "filter",
	className,
}: {
	children: ReactNode;
	/** Highlight the chip as selected (filter/choice chips) */
	active?: boolean;
	icon?: IconName;
	onClick?: () => void;
	/** Input chips only: renders a dismiss × button */
	onDismiss?: () => void;
	type?: ChipType;
	className?: string;
}) => (
	<Pressable
		onClick={onClick}
		className={cn(
			"inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
			type === "input"
				? "bg-accent text-primary px-[10px] py-[5px] text-[13px]"
				: type === "destructive"
					? "bg-destructive/10 text-destructive px-[13px] py-[7px] text-[13px]"
					: active
						? "bg-accent text-primary px-[13px] py-[7px] text-[13px]"
						: "bg-muted text-on-surface-variant hover:bg-secondary px-[13px] py-[7px] text-[13px]",
			className,
		)}
	>
		{icon && <Icon name={icon} size={13} className="shrink-0" />}
		{children}
		{onDismiss && (
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onDismiss();
				}}
				className="ml-0.5 shrink-0 rounded-full opacity-60 hover:opacity-100 transition-opacity leading-none"
				aria-label="Remove"
			>
				<Icon name="x" size={11} />
			</button>
		)}
	</Pressable>
);
