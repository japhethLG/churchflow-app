// Client-side instrumentation. Runs after the document loads but before
// React hydration. We use it to timestamp the start of every client route
// transition so the WebVitalsReporter can measure commit latency, and to
// surface a Performance-panel mark for ad-hoc profiling.
//
// This is the FE half of the navigation telemetry the audit flagged as the
// gating fix ("feels slow" was unmeasured) — paired with the backend
// LoggingInterceptor for end-to-end timing.

type RouteNavStart = {
	url: string;
	type: "push" | "replace" | "traverse";
	at: number;
};

export function onRouterTransitionStart(
	url: string,
	navigationType: "push" | "replace" | "traverse",
): void {
	try {
		(window as unknown as { __routeNavStart?: RouteNavStart }).__routeNavStart =
			{
				url,
				type: navigationType,
				at: performance.now(),
			};
		performance.mark("route-transition-start");
	} catch {
		// Instrumentation must never break navigation.
	}
}
