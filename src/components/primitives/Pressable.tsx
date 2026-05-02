"use client";

import { Button as BaseButton } from "@base-ui/react/button";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type PressableProps = {
	children: ReactNode;
	onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
	disabled?: boolean;
	className?: string;
};

// Bare interactive button — wraps `@base-ui/react`'s Button so primitives can
// apply their own appearance without reaching for the raw `<button>` element.
// Use this as the base for any selectable primitive (cards, rows, list items).
export const Pressable = ({
	children,
	onClick,
	disabled,
	className,
}: PressableProps) => (
	<BaseButton
		onClick={onClick}
		disabled={disabled}
		className={cn(
			"cursor-pointer border-none bg-transparent p-0 text-left font-inherit transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30",
			disabled && "cursor-not-allowed opacity-60",
			className,
		)}
	>
		{children}
	</BaseButton>
);
