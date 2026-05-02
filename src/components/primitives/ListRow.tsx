"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Pressable } from "./Pressable";

export type ListRowProps = {
	children: ReactNode;
	onClick?: () => void;
	active?: boolean;
	size?: "sm" | "md";
	className?: string;
};

export const ListRow = ({
	children,
	onClick,
	active,
	size = "md",
	className,
}: ListRowProps) => (
	<Pressable
		onClick={onClick}
		className={cn(
			"flex w-full items-center gap-2.5 hover:bg-muted",
			size === "sm" ? "p-2" : "p-2.5",
			active && "bg-accent",
			className,
		)}
	>
		{children}
	</Pressable>
);
