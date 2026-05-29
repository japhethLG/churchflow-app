"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/primitives/Icon";
import { Pressable } from "@/components/primitives/Pressable";
import { cn } from "@/lib/utils";
import type { NavItem } from "../sidebar/types";

// Springy easing for the active-pill grow + icon lift.
const SPRING = "ease-[cubic-bezier(0.34,1.56,0.64,1)]";

// Shared icon + label column for a tab. `active` drives the grow-in pill,
// icon lift and label weight.
const TabInner = ({
	icon,
	label,
	active,
}: {
	icon: NavItem["icon"];
	label: string;
	active: boolean;
}) => (
	<>
		<span className="relative grid h-7 w-12 place-items-center">
			{/* Pill grows in behind the icon when the tab activates. */}
			<span
				className={cn(
					"absolute inset-0 rounded-full bg-primary/12 transition-all duration-300",
					SPRING,
					active ? "scale-100 opacity-100" : "scale-50 opacity-0",
				)}
			/>
			<Icon
				name={icon}
				size={20}
				strokeWidth={active ? 2.4 : 2}
				className={cn(
					"relative transition-transform duration-300",
					SPRING,
					active ? "-translate-y-px scale-110" : "scale-100",
				)}
			/>
		</span>
		<span
			className={cn(
				"max-w-full truncate text-[10px] tracking-tight transition-all duration-200",
				active ? "font-bold" : "font-semibold",
			)}
		>
			{label}
		</span>
	</>
);

const tabClass = (active: boolean) =>
	cn(
		// The whole cell is the tap target (not just the icon/label content).
		"flex h-full w-full min-w-0 flex-col items-center justify-center gap-0.5 py-1.5 no-underline transition-colors duration-200",
		active ? "text-primary" : "text-muted-foreground active:text-foreground",
	);

const Tab = ({ item, active }: { item: NavItem; active: boolean }) => (
	<Link href={item.href} className={tabClass(active)}>
		<TabInner icon={item.icon} label={item.label} active={active} />
	</Link>
);

/**
 * Mobile-only bottom navigation — a conventional even tab bar. Shows the
 * primary destinations and, when there are more, a trailing "More" tab that
 * opens the nav-overflow sheet.
 */
export const MobileBottomNav = ({
	items,
	onMore,
	className,
}: {
	/** Primary destinations (already sliced to fit the bar). */
	items: NavItem[];
	/** Provided when there are overflow destinations → renders the "More" tab. */
	onMore?: () => void;
	className?: string;
}) => {
	const pathname = usePathname();
	const isActive = (href: string) => pathname.startsWith(href);

	const barClass =
		"pointer-events-auto mx-3 flex items-center justify-around rounded-[22px] border border-border/60 bg-card/85 px-1.5 py-1.5 shadow-lg backdrop-blur-xl backdrop-saturate-150";

	return (
		<nav
			className={cn(
				"pointer-events-none fixed inset-x-0 bottom-0 z-40 pt-8 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
				"bg-linear-to-t from-background via-background/85 to-transparent",
				className,
			)}
		>
			<div className={barClass}>
				{items.map((item) => (
					<div key={item.href} className="min-w-0 flex-1">
						<Tab item={item} active={isActive(item.href)} />
					</div>
				))}
				{onMore && (
					<div className="min-w-0 flex-1">
						<Pressable
							onClick={onMore}
							aria-label="More"
							aria-haspopup="dialog"
							className={tabClass(false)}
						>
							<TabInner icon="menu" label="More" active={false} />
						</Pressable>
					</div>
				)}
			</div>
		</nav>
	);
};
