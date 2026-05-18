"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

// Coerce Prisma-Decimal-as-string (or anything else) into a finite number.
// Local mirror keeps this primitive free of dependencies outside primitives/.
const toNum = (v: number | string | null | undefined): number => {
	if (v == null) {
		return 0;
	}
	const n = typeof v === "string" ? Number(v) : v;
	return Number.isFinite(n) ? n : 0;
};

export type ProgressSegment = {
	// `number | string` because Prisma Decimal serializes to JSON strings;
	// the primitive coerces internally so call sites can pass DTO fields
	// directly.
	value: number | string;
	color: string;
	label: string;
	// Optional formatted value shown in the hover tooltip. When omitted, the
	// tooltip shows just the label and percentage.
	displayValue?: string;
};

export type StackedProgressBarProps = {
	// In `overlay` mode segments paint on top of each other from the left
	// — used for "pledged 75%, raised 62%" style displays.
	// In `stack` mode segments paint side-by-side, sum = filled portion of
	// the track — used for categorical mix bars.
	mode?: "overlay" | "stack";
	total: number | string;
	segments: ProgressSegment[];
	size?: "xs" | "sm" | "md" | "lg" | "xl";
	className?: string;
	showLegend?: boolean;
	renderOverflow?: (overflowPct: number) => ReactNode;
	minSegmentFraction?: number;
	ariaLabel?: string;
	// Show a richer hover tooltip on each segment with label, value, and
	// share-of-total. Defaults true in stack mode (MixBar wrapper), false
	// in overlay mode.
	interactiveTooltips?: boolean;
};

const HEIGHT = {
	xs: "h-1.5",
	sm: "h-2",
	md: "h-2.5",
	lg: "h-3",
	xl: "h-5",
} as const;

export const StackedProgressBar = ({
	mode = "overlay",
	total,
	segments,
	size = "md",
	className,
	showLegend = false,
	renderOverflow,
	minSegmentFraction = 0,
	ariaLabel,
	interactiveTooltips,
}: StackedProgressBarProps) => {
	const [hovered, setHovered] = useState<number | null>(null);

	const safeTotal = Math.max(toNum(total), 1);
	const sum = segments.reduce((s, x) => s + Math.max(0, toNum(x.value)), 0);
	const overflowPct =
		sum > safeTotal ? ((sum - safeTotal) / safeTotal) * 100 : 0;

	const stackScale = mode === "stack" && sum > safeTotal ? safeTotal / sum : 1;
	const showTooltips = interactiveTooltips ?? mode === "stack";

	const hoveredSeg = hovered != null ? segments[hovered] : null;
	const hoveredVal = hoveredSeg ? toNum(hoveredSeg.value) : 0;
	const hoveredPct = sum > 0 ? Math.round((hoveredVal / sum) * 100) : 0;

	return (
		<div className={cn("w-full", className)}>
			<div className="relative w-full">
				<div
					role="progressbar"
					aria-label={ariaLabel ?? "progress"}
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.min(100, Math.round((sum / safeTotal) * 100))}
					className={cn(
						"relative w-full overflow-hidden rounded-full bg-[var(--chart-track)]",
						HEIGHT[size],
					)}
					onMouseLeave={() => setHovered(null)}
				>
					{mode === "overlay" ? (
						segments.map((seg, i) => {
							const widthPct = Math.min(
								100,
								(toNum(seg.value) / safeTotal) * 100,
							);
							if (widthPct === 0) {
								return null;
							}
							return (
								<div
									// biome-ignore lint/suspicious/noArrayIndexKey: stable by label+index
									key={`${seg.label}-${i}`}
									role="img"
									aria-label={seg.label}
									className="absolute inset-y-0 left-0 rounded-full"
									style={{
										width: `${widthPct}%`,
										background: seg.color,
										zIndex: i + 1,
									}}
									onMouseEnter={() => showTooltips && setHovered(i)}
									title={!showTooltips ? seg.label : undefined}
								/>
							);
						})
					) : (
						<div className="flex h-full w-full">
							{segments.map((seg, i) => {
								const fraction = (toNum(seg.value) * stackScale) / safeTotal;
								if (fraction <= 0 || fraction < minSegmentFraction) {
									return null;
								}
								return (
									<div
										// biome-ignore lint/suspicious/noArrayIndexKey: stable by label+index
										key={`${seg.label}-${i}`}
										role="img"
										aria-label={seg.label}
										className="h-full cursor-pointer transition-opacity"
										style={{
											width: `${fraction * 100}%`,
											background: seg.color,
											opacity: hovered != null && hovered !== i ? 0.55 : 1,
										}}
										onMouseEnter={() => showTooltips && setHovered(i)}
										title={!showTooltips ? seg.label : undefined}
									/>
								);
							})}
						</div>
					)}
				</div>

				{showTooltips && hoveredSeg && (
					<div
						className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5 text-xs text-background shadow-lg"
						style={{ bottom: "calc(100% + 6px)" }}
					>
						<div className="flex items-center gap-1.5 font-medium">
							<span
								className="inline-block size-2 rounded-sm"
								style={{ background: hoveredSeg.color }}
							/>
							{hoveredSeg.label}
						</div>
						<div className="mt-0.5 tabular-nums">
							{hoveredSeg.displayValue ??
								toNum(hoveredSeg.value).toLocaleString()}
							<span className="ml-2 opacity-70">{hoveredPct}%</span>
						</div>
					</div>
				)}
			</div>

			{(overflowPct > 0 || showLegend) && (
				<div className="mt-1.5 flex items-center justify-between gap-2">
					{showLegend ? (
						<ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
							{segments.map((seg, i) => (
								<li
									// biome-ignore lint/suspicious/noArrayIndexKey: stable by label+index
									key={`${seg.label}-${i}`}
									className="flex items-center gap-1.5"
								>
									<span
										className="inline-block size-2 rounded-sm"
										style={{ background: seg.color }}
									/>
									<span>{seg.label}</span>
								</li>
							))}
						</ul>
					) : (
						<span />
					)}
					{overflowPct > 0 && (
						<span className="rounded-full bg-(--chart-positive)/15 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.04em] text-(--chart-positive)">
							{renderOverflow
								? renderOverflow(overflowPct)
								: `+${Math.round(overflowPct)}% over`}
						</span>
					)}
				</div>
			)}
		</div>
	);
};

// Thin wrapper — same component, stack mode. Default size bumped from
// `sm` to `md` so segments are easier to hover and read.
export const MixBar = ({
	segments,
	total,
	size = "md",
	className,
	minSegmentFraction = 0.02,
	showLegend,
}: {
	segments: ProgressSegment[];
	total?: number | string;
	size?: StackedProgressBarProps["size"];
	className?: string;
	minSegmentFraction?: number;
	showLegend?: boolean;
}) => {
	const safeTotal =
		total ?? segments.reduce((s, x) => s + Math.max(0, toNum(x.value)), 0);
	return (
		<StackedProgressBar
			mode="stack"
			total={safeTotal}
			segments={segments}
			size={size}
			className={className}
			minSegmentFraction={minSegmentFraction}
			showLegend={showLegend}
		/>
	);
};
