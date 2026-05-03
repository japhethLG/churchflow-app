"use client";

import type { ComponentPropsWithoutRef } from "react";
import { forwardRef } from "react";
import { Avatar } from "@/components/primitives/Avatar";
import { Icon } from "@/components/primitives/Icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { perspectiveLabel } from "../perspective";
import type { Perspective } from "../types";

/** Own visual props plus everything Base UI merges onto the cloned trigger (handlers, aria, tabindex, …). */
export type AccountMenuTriggerProps = {
	userName: string;
	perspective: Perspective;
	menuOpen: boolean;
} & Omit<ComponentPropsWithoutRef<typeof Button>, "variant" | "type">;

export const AccountMenuTrigger = forwardRef<
	HTMLButtonElement,
	AccountMenuTriggerProps
>(function AccountMenuTrigger(
	{ userName, perspective, menuOpen, className, ...restFromTrigger },
	ref,
) {
	return (
		<Button
			ref={ref}
			{...restFromTrigger}
			type="button"
			variant="secondary"
			className={cn(
				"h-auto w-full shrink-0 justify-start gap-2.5 rounded-xl border-0 px-3 py-2.5 text-left font-normal shadow-none",
				menuOpen ? "bg-secondary" : "bg-muted hover:bg-muted",
				className,
			)}
		>
			<Avatar name={userName} size={32} />
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-semibold text-foreground">
					{userName}
				</div>
				<div className="text-xs text-muted-foreground">
					{perspectiveLabel(perspective)}
				</div>
			</div>
			<Icon
				name="chevronDown"
				size={14}
				className={cn(
					"shrink-0 text-muted-foreground transition-transform duration-200",
					menuOpen && "rotate-180",
				)}
			/>
		</Button>
	);
});
