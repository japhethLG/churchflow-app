"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { Pressable } from "@/components/primitives/Pressable";
import { cn } from "@/lib/utils";
import type { NavItem } from "../sidebar/types";

const Tab = ({ item, active }: { item: NavItem; active: boolean }) => (
	<Link
		href={item.href}
		className={cn(
			"flex flex-col items-center gap-0.5 py-1.5 no-underline transition-colors",
			active ? "text-primary" : "text-muted-foreground",
		)}
	>
		<span
			className={cn(
				"grid h-7 w-9 place-items-center rounded-[10px]",
				active && "bg-primary/12",
			)}
		>
			<Icon name={item.icon} size={20} strokeWidth={active ? 2.4 : 2} />
		</span>
		<span className="text-[10px] font-semibold tracking-tight">
			{item.label}
		</span>
	</Link>
);

/**
 * Mobile-only bottom navigation. When `onRecordGift` is provided (admin
 * perspective) it renders the FAB-centered variant — two tabs, a raised
 * primary action, two tabs — with a floating "More" affordance for nav
 * overflow. Otherwise it falls back to a conventional even tab bar.
 */
export const MobileBottomNav = ({
	items,
	onRecordGift,
	onMore,
	className,
}: {
	/** Primary destinations (already sliced to fit the bar). */
	items: NavItem[];
	/** Provided for admins → renders the centered record-gift FAB. */
	onRecordGift?: () => void;
	/** Provided when there are overflow destinations → renders "More". */
	onMore?: () => void;
	className?: string;
}) => {
	const pathname = usePathname();
	const isActive = (href: string) => pathname.startsWith(href);

	const barClass =
		"pointer-events-auto mx-3 flex items-center rounded-[22px] border border-border/60 bg-card/85 px-1.5 py-1.5 shadow-lg backdrop-blur-xl backdrop-saturate-150";

	const fabMode = Boolean(onRecordGift);

	return (
		<nav
			className={cn(
				"pointer-events-none fixed inset-x-0 bottom-0 z-40 pt-8 pb-[max(0.75rem,env(safe-area-inset-bottom))]",
				"bg-linear-to-t from-background via-background/85 to-transparent",
				className,
			)}
		>
			{fabMode ? (
				<>
					{/* Bar first so the raised FAB + More paint above it. */}
					<div
						className={cn(barClass, "grid grid-cols-[1fr_1fr_64px_1fr_1fr]")}
					>
						{items.slice(0, 2).map((item) => (
							<Tab key={item.href} item={item} active={isActive(item.href)} />
						))}
						<span aria-hidden />
						{items.slice(2, 4).map((item) => (
							<Tab key={item.href} item={item} active={isActive(item.href)} />
						))}
					</div>

					{/* Raised record-gift action, centered above the bar. */}
					<div className="pointer-events-auto absolute inset-x-0 bottom-[38px] z-10 flex justify-center">
						<Button
							role="primary"
							recipe="gradient"
							icon="plus"
							aria-label="Record a gift"
							onClick={onRecordGift}
							className="size-14 rounded-full px-0 shadow-[0_8px_24px_rgba(91,84,240,0.45),0_2px_6px_rgba(0,0,0,0.4)] ring-4 ring-background transition-transform active:scale-95"
						/>
					</div>

					{onMore && (
						<Pressable
							onClick={onMore}
							className="pointer-events-auto absolute right-4 bottom-[88px] z-10 grid size-11 place-items-center rounded-full border border-border/60 bg-card/95 text-muted-foreground shadow-lg backdrop-blur-xl"
						>
							<Icon name="menu" size={20} />
						</Pressable>
					)}
				</>
			) : (
				<div className={cn(barClass, "justify-around")}>
					{items.map((item) => (
						<div key={item.href} className="flex-1">
							<Tab item={item} active={isActive(item.href)} />
						</div>
					))}
					{onMore && (
						<Pressable
							onClick={onMore}
							className="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-muted-foreground"
						>
							<span className="grid h-7 w-9 place-items-center rounded-[10px]">
								<Icon name="menu" size={20} />
							</span>
							<span className="text-[10px] font-semibold tracking-tight">
								More
							</span>
						</Pressable>
					)}
				</div>
			)}
		</nav>
	);
};
