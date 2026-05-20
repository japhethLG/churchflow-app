"use client";

import { Archive } from "lucide-react";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

// Top-of-detail-page banner shown when the entity is soft-deleted. Two
// variants:
//
//   admin   — full message with deletion timestamp + Restore button.
//   member  — same banner, no actor name, no restore button. Members see
//             this when they navigate to a deleted referenced entity
//             (e.g. their pledge points at an archived campaign). The
//             banner conveys "this is no longer active" without exposing
//             admin actions or actor identity.
export type EntityRestoreBannerProps = {
	entityLabel: string;
	deletedAt: unknown;
	/** When provided, shows a Restore button that triggers this callback. */
	onRestore?: () => void;
	restoreLoading?: boolean;
	/** Member-variant copy override. Defaults to the admin variant. */
	memberVariant?: boolean;
	className?: string;
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

export const EntityRestoreBanner = ({
	entityLabel,
	deletedAt,
	onRestore,
	restoreLoading,
	memberVariant,
	className,
}: EntityRestoreBannerProps) => {
	const dateLike = toDateLike(deletedAt);
	const dateLabel = dateLike ? dayjs(dateLike).format("MMM D, YYYY") : null;

	const message = memberVariant
		? `This ${entityLabel.toLowerCase()} has been archived.`
		: dateLabel
			? `This ${entityLabel.toLowerCase()} was deleted on ${dateLabel}.`
			: `This ${entityLabel.toLowerCase()} has been deleted.`;

	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm",
				className,
			)}
		>
			<Archive className="size-5 shrink-0 text-amber-700" aria-hidden />
			<div className="flex-1 leading-relaxed text-amber-900">
				<span className="font-semibold">Archived.</span> {message}
				{!memberVariant && (
					<span className="ml-1 text-amber-700">
						All operations are disabled until it is restored.
					</span>
				)}
			</div>
			{onRestore && !memberVariant && (
				<Button role="secondary" onClick={onRestore} loading={restoreLoading}>
					Restore
				</Button>
			)}
		</div>
	);
};
