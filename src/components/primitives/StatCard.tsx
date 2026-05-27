import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { Icon, type IconName } from "./Icon";

/**
 * Optional mobile-only adaptation. Desktop (`md` and up) renders identically
 * regardless — only the sub-`md` presentation changes:
 *  - `hero`    → slightly tighter padding, large-but-not-huge value.
 *  - `compact` → small value, trimmed label, icon hidden; sized to sit 3-up.
 */
type MobileVariant = "hero" | "compact";

const PADDING_CLASS: Record<MobileVariant, string> = {
	hero: "p-5 md:p-6",
	compact: "p-3 md:p-6",
};
const VALUE_CLASS: Record<MobileVariant, string> = {
	hero: "text-[2.25rem] md:text-5xl",
	compact: "text-xl md:text-5xl",
};
const HEADER_MB_CLASS: Record<MobileVariant, string> = {
	hero: "mb-3 md:mb-4",
	compact: "mb-1.5 md:mb-4",
};
const LABEL_CLASS: Record<MobileVariant, string> = {
	hero: "text-xs",
	compact: "text-[10px] md:text-xs",
};
const CAPTION_CLASS: Record<MobileVariant, string> = {
	hero: "text-sm",
	compact: "text-[11px] md:text-sm",
};

export const StatCard = ({
	label,
	value,
	caption,
	delta,
	deltaDirection,
	icon,
	accent,
	mobileVariant,
	className,
}: {
	label: string;
	value: ReactNode;
	caption?: ReactNode;
	delta?: string;
	deltaDirection?: "up" | "down" | "flat";
	icon?: IconName;
	accent?: boolean;
	mobileVariant?: MobileVariant;
	className?: string;
}) => {
	const DeltaIcon =
		deltaDirection === "up"
			? TrendingUp
			: deltaDirection === "down"
				? TrendingDown
				: Minus;

	return (
		<Card
			padding={24}
			className={cn(
				"flex flex-col justify-between",
				mobileVariant && PADDING_CLASS[mobileVariant],
				className,
			)}
		>
			<div
				className={cn(
					"flex justify-between items-start",
					mobileVariant ? HEADER_MB_CLASS[mobileVariant] : "mb-4",
				)}
			>
				<div className="flex items-center gap-2 min-w-0">
					{icon && (
						<div
							className={cn(
								"flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary",
								mobileVariant === "compact" && "hidden md:flex",
							)}
						>
							<Icon name={icon} size={18} />
						</div>
					)}
					<span
						className={cn(
							"font-bold tracking-[0.08em] uppercase text-muted-foreground",
							mobileVariant ? LABEL_CLASS[mobileVariant] : "text-xs",
						)}
					>
						{label}
					</span>
				</div>
				{delta && (
					<Badge
						color={
							deltaDirection === "up"
								? "green"
								: deltaDirection === "down"
									? "red"
									: "neutral"
						}
						className="gap-1 px-2 shrink-0"
					>
						<DeltaIcon className="h-3 w-3" />
						{delta}
					</Badge>
				)}
			</div>

			<div
				className={cn(
					"font-bold tracking-tight tabular-nums leading-none flex-1",
					mobileVariant ? VALUE_CLASS[mobileVariant] : "text-5xl",
					accent
						? "bg-linear-to-br from-ring to-primary bg-clip-text text-transparent"
						: "text-foreground",
				)}
			>
				{value}
			</div>

			{caption && (
				<div
					className={cn(
						"mt-2.5 font-medium text-muted-foreground leading-relaxed",
						mobileVariant ? CAPTION_CLASS[mobileVariant] : "text-sm",
					)}
				>
					{caption}
				</div>
			)}
		</Card>
	);
};
