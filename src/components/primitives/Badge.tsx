import type { ReactNode } from "react";
import { Badge as ShadedBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BadgeColor =
	| "neutral"
	| "indigo"
	| "green"
	| "blue"
	| "amber"
	| "purple"
	| "teal"
	| "clay"
	| "red"
	| "gray";

export const Badge = ({
	children,
	color = "neutral",
	dot,
	className,
}: {
	children: ReactNode;
	color?: BadgeColor;
	dot?: boolean;
	className?: string;
}) => {
	const colorMap: Record<BadgeColor, any> = {
		neutral: "outline",
		indigo: "info",
		green: "success",
		blue: "blue",
		amber: "warning",
		purple: "purple",
		teal: "teal",
		clay: "tertiary",
		red: "red",
		gray: "gray",
	};

	return (
		<ShadedBadge
			variant={colorMap[color]}
			className={cn(
				"rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight",
				className,
			)}
		>
			{dot && (
				<span
					className={cn(
						"mr-1.5 size-2 rounded-full",
						color === "neutral" ? "bg-muted-foreground" : "bg-current",
					)}
				/>
			)}
			{children}
		</ShadedBadge>
	);
};

export type TransactionType =
	| "Tithe"
	| "Offering"
	| "Mission"
	| "First Fruit"
	| "Commitment"
	| "Donation"
	| "Other";

export const TypeBadge = ({ type }: { type: TransactionType }) => {
	const map: Record<TransactionType, BadgeColor> = {
		Tithe: "indigo",
		Offering: "green",
		Mission: "blue",
		"First Fruit": "amber",
		Commitment: "purple",
		Donation: "teal",
		Other: "neutral",
	};
	return (
		<Badge color={map[type]} dot>
			{type}
		</Badge>
	);
};

export type Status =
	| "Active"
	| "Upcoming"
	| "Pending"
	| "Completed"
	| "Cancelled"
	| "Inactive"
	| "Ongoing";

export const StatusBadge = ({ status }: { status: Status }) => {
	const map: Record<Status, { c: BadgeColor; label: string }> = {
		Active: { c: "green", label: "Active" },
		Upcoming: { c: "green", label: "Upcoming" },
		Pending: { c: "amber", label: "Pending" },
		Completed: { c: "gray", label: "Completed" },
		Cancelled: { c: "red", label: "Cancelled" },
		Inactive: { c: "neutral", label: "Inactive" },
		Ongoing: { c: "blue", label: "Ongoing" },
	};
	const s = map[status];
	return (
		<Badge color={s.c} dot>
			{s.label}
		</Badge>
	);
};
