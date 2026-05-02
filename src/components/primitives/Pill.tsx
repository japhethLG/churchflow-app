"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Pressable } from "./Pressable";

export type PillProps = {
	children: ReactNode;
	active?: boolean;
	disabled?: boolean;
	onClick?: () => void;
	className?: string;
};

export const Pill = ({
	children,
	active,
	disabled,
	onClick,
	className,
}: PillProps) => (
	<Pressable
		disabled={disabled}
		onClick={onClick}
		className={cn(
			"flex-1 rounded-full border-[1.5px] px-3.5 py-2.5 text-center text-[13px]",
			active
				? "border-primary bg-accent font-semibold text-primary"
				: "border-transparent bg-input font-medium text-foreground",
			className,
		)}
	>
		{children}
	</Pressable>
);
