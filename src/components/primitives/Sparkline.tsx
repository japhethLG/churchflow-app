"use client";

import dynamic from "next/dynamic";
import type { SparklineProps } from "./SparklineImpl";

export type { SparklineProps } from "./SparklineImpl";

// Lazy boundary around the recharts-backed sparkline. List rows (members,
// transactions) render many of these; keeping recharts behind next/dynamic
// keeps the ~168 KB chart lib off the list route's first-load JS. The chunk
// is shared, so all rows on a page resolve it once.
export const Sparkline = dynamic(
	() => import("./SparklineImpl").then((m) => m.Sparkline),
	{ ssr: false, loading: () => null },
) as (props: SparklineProps) => React.ReactNode;
