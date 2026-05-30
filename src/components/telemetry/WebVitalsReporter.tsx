"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useEffect, useRef } from "react";

// Optional collection endpoint. When set, metrics are beaconed there;
// otherwise they log to the console in development so they're observable
// without any backend. Either way, "feels slow" stops being a guess.
const VITALS_URL = process.env.NEXT_PUBLIC_VITALS_URL;

type RouteNavStart = {
	url: string;
	type: string;
	at: number;
};

const emit = (payload: Record<string, unknown>): void => {
	try {
		if (VITALS_URL && typeof navigator.sendBeacon === "function") {
			navigator.sendBeacon(VITALS_URL, JSON.stringify(payload));
		} else if (process.env.NODE_ENV !== "production") {
			console.debug("[telemetry]", payload);
		}
	} catch {
		// never let telemetry throw into the render path
	}
};

// Collapse concrete URLs into route patterns so metrics aggregate cleanly
// (the tenant slug and entity ids would otherwise explode cardinality).
const toRoutePattern = (pathname: string): string => {
	const segments = pathname.split("/").filter(Boolean);
	if (segments.length === 0) {
		return "/";
	}
	const isId = (s: string) =>
		/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s) || /^\d+$/.test(s);
	const mapped = segments.map((seg, i) => {
		if (i === 0) {
			return ":tenant"; // first segment is the tenant slug
		}
		return isId(seg) ? ":id" : seg;
	});
	return `/${mapped.join("/")}`;
};

// Reports Core Web Vitals (LCP / INP / CLS / TTFB / FCP) and SPA
// route-transition commit latency, each tagged with the route pattern.
export const WebVitalsReporter = (): null => {
	const pathname = usePathname();
	const route = toRoutePattern(pathname);

	useReportWebVitals((metric) => {
		emit({
			kind: "web-vital",
			name: metric.name,
			value: Math.round(metric.value * 100) / 100,
			rating: metric.rating,
			id: metric.id,
			route,
		});
	});

	// Pair the transition start recorded in instrumentation-client with the
	// pathname commit to derive client-side navigation latency.
	const prevPath = useRef(pathname);
	useEffect(() => {
		if (prevPath.current === pathname) {
			return;
		}
		prevPath.current = pathname;
		const start = (window as unknown as { __routeNavStart?: RouteNavStart })
			.__routeNavStart;
		if (start) {
			emit({
				kind: "route-transition",
				to: route,
				type: start.type,
				ms: Math.round(performance.now() - start.at),
			});
		}
	}, [pathname, route]);

	return null;
};
