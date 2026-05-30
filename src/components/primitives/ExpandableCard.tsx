"use client";

import Link from "next/link";
import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { Pressable } from "./Pressable";
import { type RowAction, RowActionsMenu } from "./RowActionsMenu";

export type ExpandableCardDetail = {
	label: ReactNode;
	value: ReactNode;
};

export type ExpandableCardProps = {
	/** Always-visible collapsed headline (identity + primary metric). */
	children: ReactNode;
	/** Rows revealed on expand — the columns that don't fit the headline. */
	details?: ExpandableCardDetail[];
	/**
	 * When set, tapping the headline navigates here — the mobile equivalent of
	 * a desktop row's `onRowClick`/cell link. The expand chevron (when there are
	 * `details`) stays a separate control so both affordances coexist.
	 */
	href?: string;
	defaultExpanded?: boolean;
	/** Tombstone styling — muted when the row's own entity is soft-deleted. */
	deleted?: boolean;
	/**
	 * Row-level actions (edit/delete/restore). Surfaced as a kebab menu in the
	 * headline — the mobile equivalent of a desktop row's `RowActionsMenu`
	 * column. Use for entities with no detail page to manage from; entities that
	 * link to a detail page should prefer `href` and manage there. Empty array →
	 * no menu.
	 */
	actions?: RowAction[];
	className?: string;
};

// Mobile counterpart to a desktop table row. Primary identity + the single
// most important metric stay collapsed; the remaining columns reveal on tap
// into a tinted drawer. The chevron rotates to signal expandability.
//
// With `href`, the headline becomes a link to the row's detail page (matching
// the desktop row link) and the chevron is the dedicated expand control. With
// no `details` and no `href`, the card is a plain, non-interactive surface.
export const ExpandableCard = ({
	children,
	details = [],
	href,
	defaultExpanded = false,
	deleted = false,
	actions = [],
	className,
}: ExpandableCardProps) => {
	const [open, setOpen] = useState(defaultExpanded);
	const hasDetails = details.length > 0;
	const actionsMenu =
		actions.length > 0 ? (
			<div className="flex shrink-0 items-center self-center">
				<RowActionsMenu actions={actions} />
			</div>
		) : null;

	const drawer = hasDetails ? (
		// Animate height open/close via the grid 0fr→1fr trick (no JS height
		// measuring); the inner wrapper clips the rows while collapsed.
		<div
			className={cn(
				"grid transition-[grid-template-rows] duration-200 ease-out",
				open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
			)}
		>
			<div className="overflow-hidden">
				<div
					className={cn(
						"border-t border-border bg-muted/40 px-3.5 transition-opacity duration-200",
						open ? "opacity-100" : "opacity-0",
					)}
				>
					{details.map((d, i) => (
						<div
							// biome-ignore lint/suspicious/noArrayIndexKey: detail rows are a fixed, ordered list per card
							key={i}
							className={cn(
								"flex items-center justify-between gap-3 py-2.5",
								i < details.length - 1 && "border-b border-border/60",
							)}
						>
							<span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
								{d.label}
							</span>
							<div className="min-w-0 text-right">{d.value}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	) : null;

	// Dedicated expand toggle — used in `href` mode where the headline is a link.
	const chevronToggle = hasDetails ? (
		<Pressable
			onClick={() => setOpen((v) => !v)}
			aria-label={open ? "Collapse" : "Expand"}
			aria-expanded={open}
			className={cn(
				"grid size-6 shrink-0 self-center place-items-center rounded-lg bg-muted text-muted-foreground transition-transform duration-200",
				open && "rotate-180",
			)}
		>
			<Icon name="chevronDown" size={14} />
		</Pressable>
	) : null;

	// ── Linked headline: navigates on tap; chevron expands independently ──────
	if (href) {
		return (
			<Card
				padding={0}
				className={cn(
					"overflow-hidden gap-0",
					deleted && "opacity-60",
					className,
				)}
			>
				<div className="flex items-stretch gap-3 p-3.5">
					<Link href={href} className="min-w-0 flex-1 no-underline">
						{children}
					</Link>
					{actionsMenu}
					{chevronToggle}
				</div>
				{drawer}
			</Card>
		);
	}

	// ── Plain / expand-only: the whole headline toggles the drawer ────────────
	return (
		<Card
			padding={0}
			className={cn(
				"overflow-hidden gap-0",
				deleted && "opacity-60",
				className,
			)}
		>
			<div className="flex items-stretch gap-3 p-3.5">
				<Pressable
					onClick={hasDetails ? () => setOpen((v) => !v) : undefined}
					className={cn(
						"flex min-w-0 flex-1 items-stretch gap-3",
						!hasDetails && "cursor-default",
					)}
				>
					<div className="min-w-0 flex-1">{children}</div>
					{hasDetails && (
						<div
							className={cn(
								"grid size-6 shrink-0 self-center place-items-center rounded-lg bg-muted text-muted-foreground transition-transform duration-200",
								open && "rotate-180",
							)}
						>
							<Icon name="chevronDown" size={14} />
						</div>
					)}
				</Pressable>
				{actionsMenu}
			</div>
			{drawer}
		</Card>
	);
};
