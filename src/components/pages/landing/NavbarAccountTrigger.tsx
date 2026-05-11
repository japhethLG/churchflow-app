"use client";

import type { ReactElement } from "react";
import { forwardRef } from "react";
import { Avatar } from "@/components/primitives/Avatar";
import { Icon } from "@/components/primitives/Icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Navbar variant of the AccountMenu trigger — a compact avatar pill that
 * fits next to anchor links rather than the full identity row used in
 * the sidebar. Base UI forwards trigger props (`onClick`, aria, …) onto
 * this element via `render`, so we just own the appearance.
 */
type NavbarAccountTriggerProps = {
	userName: string;
	menuOpen: boolean;
	className?: string;
} & React.ComponentPropsWithoutRef<"button">;

export const NavbarAccountTrigger = forwardRef<
	HTMLButtonElement,
	NavbarAccountTriggerProps
>(function NavbarAccountTrigger(
	{ userName, menuOpen, className, ...rest },
	ref,
) {
	return (
		<Button
			ref={ref}
			{...rest}
			type="button"
			variant="ghost"
			className={cn(
				"group h-10 shrink-0 gap-2 rounded-full border border-transparent px-1.5 pr-3 text-sm font-medium text-foreground transition-all",
				"hover:border-border/60 hover:bg-card",
				menuOpen && "border-border/60 bg-card",
				className,
			)}
		>
			<Avatar name={userName} size={28} />
			<span className="hidden max-w-[120px] truncate text-foreground sm:inline">
				{userName.split(" ")[0]}
			</span>
			<Icon
				name="chevronDown"
				size={14}
				className={cn(
					"text-muted-foreground transition-transform duration-200",
					menuOpen && "rotate-180",
				)}
			/>
		</Button>
	);
});

/** Convenience for passing to AccountMenu's renderTrigger prop. */
export const navbarAccountTrigger = ({
	menuOpen,
	userName,
}: {
	menuOpen: boolean;
	userName: string;
}): ReactElement => (
	<NavbarAccountTrigger menuOpen={menuOpen} userName={userName} />
);
