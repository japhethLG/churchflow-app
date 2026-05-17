"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

// Mode-B (tombstone reference) label. Render any entity reference that
// points at a soft-deleted row through this component so it gets a
// uniform muted treatment + "deleted" pill + tooltip with deletion date.
//
// When `href` is provided the label is clickable and navigates to the
// archived detail page (read-only banner view). When `href` is omitted
// the label is plain text — use this where the row itself is a tombstone
// (Mode C — the surrounding row already conveys the deleted state).
// `deletedAt` is intentionally `unknown` — the generated openapi-fetch
// schema sometimes types it as `Record<string, never> | null` rather than
// `string | null`, so callers should be able to pass it through without
// extra coercion.
export type DeletedLabelProps = {
	children: ReactNode;
	deletedAt?: unknown;
	href?: string;
	/** Optional className applied to the inline wrapper. */
	className?: string;
	/** Hide the inline "deleted" pill — leave only the muted text. */
	hidePill?: boolean;
};

const toDateLike = (v: unknown): Date | string | null => {
	if (v instanceof Date) {
		return v;
	}
	if (typeof v === "string") {
		return v;
	}
	return null;
};

export const DeletedLabel = ({
	children,
	deletedAt,
	href,
	className,
	hidePill,
}: DeletedLabelProps) => {
	const dateLike = toDateLike(deletedAt);
	const tooltipText = dateLike
		? `Deleted ${dayjs(dateLike).format("MMM D, YYYY")}`
		: "Deleted";

	const inner = (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-muted-foreground",
				href && "cursor-pointer hover:text-foreground hover:underline",
				className,
			)}
		>
			{children}
			{!hidePill && (
				<span className="inline-flex h-4 items-center rounded-sm bg-muted px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
					deleted
				</span>
			)}
		</span>
	);

	const wrapped = href ? <Link href={href}>{inner}</Link> : inner;

	return (
		<Tooltip>
			<TooltipTrigger render={<span>{wrapped}</span>} />
			<TooltipContent>{tooltipText}</TooltipContent>
		</Tooltip>
	);
};
