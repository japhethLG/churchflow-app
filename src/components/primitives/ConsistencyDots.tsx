"use client";

import { cn } from "@/lib/utils";

export type ConsistencyDotsProps = {
	// One value per period, oldest first. true = activity, false = no
	// activity, "partial" = some-but-low activity (drawn as a half-fill).
	values: (boolean | "partial")[];
	size?: "sm" | "md";
	filledColor?: string;
	emptyColor?: string;
	partialColor?: string;
	// Optional period names for hover tooltips — same length as values.
	periodLabels?: string[];
	className?: string;
};

const SIZE = {
	sm: "size-2",
	md: "size-2.5",
} as const;

export const ConsistencyDots = ({
	values,
	size = "md",
	filledColor = "var(--chart-current)",
	emptyColor = "var(--chart-track)",
	partialColor = "var(--chart-prior)",
	periodLabels,
	className,
}: ConsistencyDotsProps) => {
	return (
		<div
			className={cn("flex items-center gap-1", className)}
			role="img"
			aria-label={`activity over last ${values.length} periods`}
		>
			{values.map((v, i) => {
				const color =
					v === true
						? filledColor
						: v === "partial"
							? partialColor
							: emptyColor;
				const title = periodLabels?.[i];
				return (
					<span
						key={i}
						className={cn(
							"shrink-0 rounded-full",
							SIZE[size],
							v === false && "border border-border bg-transparent",
						)}
						style={v === false ? undefined : { background: color }}
						title={title}
					/>
				);
			})}
		</div>
	);
};
