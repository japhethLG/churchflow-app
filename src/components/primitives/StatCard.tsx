import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { Icon, type IconName } from "./Icon";

export const StatCard = ({
	label,
	value,
	caption,
	delta,
	deltaDirection,
	icon,
	accent,
	className,
}: {
	label: string;
	value: ReactNode;
	caption?: ReactNode;
	delta?: string;
	deltaDirection?: "up" | "down" | "flat";
	icon?: IconName;
	accent?: boolean;
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
			className={cn("flex flex-col justify-between", className)}
		>
			<div className="flex justify-between items-start mb-4">
				<div className="flex items-center gap-2">
					{icon && (
						<div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<Icon name={icon} size={18} />
						</div>
					)}
					<span className="text-xs font-bold tracking-[0.08em] uppercase text-muted-foreground">
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
						className="gap-1 px-2"
					>
						<DeltaIcon className="h-3 w-3" />
						{delta}
					</Badge>
				)}
			</div>

			<div
				className={cn(
					"text-5xl font-bold tracking-tight tabular-nums leading-none flex-1",
					accent
						? "bg-linear-to-br from-ring to-primary bg-clip-text text-transparent"
						: "text-foreground",
				)}
			>
				{value}
			</div>

			{caption && (
				<div className="mt-2.5 text-sm font-medium text-muted-foreground leading-relaxed">
					{caption}
				</div>
			)}
		</Card>
	);
};
