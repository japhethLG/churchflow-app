"use client";

import { useWatch } from "react-hook-form";
import { Icon } from "@/components/primitives/Icon";
import { Pill } from "@/components/primitives/Pill";
import { Pressable } from "@/components/primitives/Pressable";
import { formatCurrency } from "@/lib/format-currency";
import type { GiftRowValues } from "./formHelpers";
import { typeLabelFor } from "./formHelpers";

export type CollapsedGiftRowProps = {
	index: number;
	onExpand: () => void;
	onRemove: () => void;
};

export const CollapsedGiftRow = ({
	index,
	onExpand,
	onRemove,
}: CollapsedGiftRowProps) => {
	const row = (useWatch({ name: `gifts.${index}` }) ??
		{}) as Partial<GiftRowValues>;
	const amount = Number(row.amount) || 0;
	const summary = summariseRow(row);

	return (
		<div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
			<span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
				{index + 1}
			</span>
			<div className="flex min-w-0 flex-1 items-center gap-3">
				<span className="shrink-0 text-base font-semibold tabular-nums">
					{amount > 0 ? formatCurrency(amount) : "—"}
				</span>
				{row.type && (
					<Pill active className="flex-none! px-2.5! py-1! text-xs!">
						{typeLabelFor(row.type)}
					</Pill>
				)}
				{summary && (
					<span className="truncate text-sm text-muted-foreground">
						{summary}
					</span>
				)}
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<Pressable
					onClick={onExpand}
					className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
				>
					<Icon name="edit" size={14} />
				</Pressable>
				<Pressable
					onClick={onRemove}
					className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted"
				>
					<Icon name="x" size={14} />
				</Pressable>
			</div>
		</div>
	);
};

const summariseRow = (row: Partial<GiftRowValues>): string => {
	const parts: string[] = [];
	if (row.pledgeId) {
		parts.push("Linked to pledge");
	} else if (row.campaignItemId) {
		parts.push("Earmarked");
	} else if (row.campaignId) {
		parts.push("Campaign");
	}
	if (row.referenceNumber) {
		parts.push(`Ref ${row.referenceNumber}`);
	}
	if (row.note) {
		parts.push(row.note);
	}
	return parts.join(" · ");
};
