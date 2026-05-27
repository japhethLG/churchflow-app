"use client";

import Link from "next/link";
import { Fragment } from "react";
import { BottomSheet } from "@/components/primitives/BottomSheet";
import { Card } from "@/components/primitives/Card";
import { Icon } from "@/components/primitives/Icon";
import type { NavItem } from "../sidebar/types";

/**
 * Mobile nav-overflow sheet. Holds the destinations that don't fit in the
 * bottom bar. Account / switch-church / sign-out live in the AccountSheet
 * (opened from the top-bar identity) — this surface is navigation only.
 */
export const MoreSheet = ({
	open,
	onOpenChange,
	items,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: NavItem[];
}) => {
	return (
		<BottomSheet
			open={open}
			onOpenChange={onOpenChange}
			title="More"
			description="Other places to go in this church."
		>
			<Card padding={8} className="mt-2">
				{items.map((item, i) => (
					<Fragment key={item.href}>
						<Link
							href={item.href}
							onClick={() => onOpenChange(false)}
							className="flex items-center gap-3 rounded-xl p-2.5 no-underline transition-colors hover:bg-muted"
						>
							<span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary">
								<Icon name={item.icon} size={18} />
							</span>
							<span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
								{item.label}
							</span>
							<Icon
								name="chevronRight"
								size={16}
								className="shrink-0 text-muted-foreground"
							/>
						</Link>
						{i < items.length - 1 && <div className="mx-3 h-px bg-border" />}
					</Fragment>
				))}
			</Card>

			<div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
				<Icon name="user" size={14} className="shrink-0" />
				<span>Switch church or sign out — tap your church up top.</span>
			</div>
		</BottomSheet>
	);
};
