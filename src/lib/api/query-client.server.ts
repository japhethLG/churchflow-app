import "server-only";
import { QueryClient } from "@tanstack/react-query";
import { cache } from "react";

// One QueryClient per RSC render pass. React `cache()` memoizes it for the
// duration of a single request, so a layout and the page beneath it
// accumulate their prefetches into the SAME client and a later
// dehydrate()/HydrationBoundary picks up everything seeded so far.
//
// staleTime mirrors the browser QueryProvider so a freshly-hydrated query
// isn't treated as immediately stale and refetched on mount — the whole
// point of prefetching is that the first client render is a cache hit.
export const getServerQueryClient = cache(
	() =>
		new QueryClient({
			defaultOptions: { queries: { staleTime: 30_000 } },
		}),
);
