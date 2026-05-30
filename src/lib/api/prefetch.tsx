import "server-only";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getServerQueryClient } from "./query-client.server";
import { serverApi } from "./server";

// Server-side prefetch into the request's QueryClient under the EXACT
// [path, init] key the browser `useApiQuery(path, init)` uses, so when the
// client composite mounts the hook resolves from the hydrated cache instead
// of waterfalling a fresh request (blank → spinner → data becomes
// shell → data). Uses serverApi (session-cookie auth) for the fetch.
//
// IMPORTANT: the `init` must be byte-for-byte the same object the client
// hook builds (TanStack hashes the key), so only prefetch queries whose init
// is deterministic server-side — NOT ones keyed on client-computed dayjs
// windows or viewport-dependent page sizes (those stay client-fetched and
// are smoothed by keepPreviousData + the loading skeleton).
//
// prefetchQuery never throws — a failed prefetch (e.g. backend hiccup) just
// leaves the cache cold and the client refetches normally.
export async function prefetchApiQuery(
	path: string,
	init?: unknown,
): Promise<void> {
	const qc = getServerQueryClient();
	await qc.prefetchQuery({
		queryKey: [path, init],
		queryFn: async () => {
			// biome-ignore lint/suspicious/noExplicitAny: mirrors useApiQuery's internal dispatch
			const { data, error } = await (serverApi as any).GET(path, init);
			if (error) {
				throw error;
			}
			return data;
		},
	});
}

// Wraps server-rendered children in a HydrationBoundary carrying everything
// prefetched into the request's QueryClient so far. Place it around the
// client composite in an RSC page/layout after calling prefetchApiQuery().
export const HydrateClient = ({ children }: { children: ReactNode }) => {
	return (
		<HydrationBoundary state={dehydrate(getServerQueryClient())}>
			{children}
		</HydrationBoundary>
	);
};
