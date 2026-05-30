"use client";

import dynamic from "next/dynamic";
import type { DonutChartProps } from "./DonutChartImpl";

export type { DonutChartProps, DonutSlice } from "./DonutChartImpl";

// Lazy boundary for the donut. recharts (~168 KB gzip) is loaded only when a
// donut actually renders, instead of being pulled synchronously into every
// chart-bearing route's first-load JS. The container reserves height, so the
// brief load shows empty space rather than shifting layout.
export const DonutChart = dynamic(
	() => import("./DonutChartImpl").then((m) => m.DonutChartImpl),
	{ ssr: false, loading: () => null },
) as (props: DonutChartProps) => React.ReactNode;
