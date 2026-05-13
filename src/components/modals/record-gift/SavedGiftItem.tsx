"use client";

import { Icon } from "@/components/primitives/Icon";
import { Pill } from "@/components/primitives/Pill";
import { Pressable } from "@/components/primitives/Pressable";
import { formatCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import type { GiftRowValues } from "./formHelpers";
import { typeLabelFor } from "./formHelpers";

export type SavedGiftItemProps = {
	index: number;
	value: GiftRowValues;
	editing: boolean;
	onClick: () => void;
	onRemove: () => void;
};

export const SavedGiftItem = ({
	index,
	value,
	editing,
	onClick,
	onRemove,
}: SavedGiftItemProps) => {
	const amount = Number(value.amount) || 0;
	const summary = summariseRow(value);

	return (
		<div
			className={cn(
				"group relative flex items-center gap-3 rounded-2xl border bg-card px-3 py-2.5 transition-colors",
				editing
					? "border-primary ring-1 ring-primary/30"
					: "border-border hover:border-primary/40 hover:bg-muted/40",
			)}
		>
			<Pressable
				onClick={onClick}
				className="flex min-w-0 flex-1 items-center gap-3 text-left"
				aria-label={`Edit gift ${index + 1}`}
			>
				<span
					className={cn(
						"grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
						editing
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground",
					)}
				>
					{index + 1}
				</span>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<span className="shrink-0 text-sm font-semibold tabular-nums">
							{amount > 0 ? formatCurrency(amount) : "—"}
						</span>
						<Pill active className="flex-none! px-2! py-0.5! text-[11px]!">
							{typeLabelFor(value.type)}
						</Pill>
						{editing && (
							<span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-primary">
								Editing
							</span>
						)}
					</div>
					{summary && (
						<span className="truncate text-xs text-muted-foreground">
							{summary}
						</span>
					)}
				</div>
			</Pressable>
			<Pressable
				onClick={onRemove}
				className="grid size-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive"
				aria-label={`Remove gift ${index + 1}`}
			>
				<Icon name="trash" size={14} />
			</Pressable>
		</div>
	);
};

const summariseRow = (row: GiftRowValues): string => {
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
