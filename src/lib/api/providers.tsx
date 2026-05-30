"use client";

import {
	keepPreviousData,
	MutationCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { type ReactNode, useState } from "react";
import { toast } from "@/components/primitives/Toaster";
import { AuthNavigationBridge } from "@/lib/auth/AuthNavigationBridge";

export const QueryProvider = ({ children }: { children: ReactNode }) => {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30_000,
						refetchOnWindowFocus: false,
						retry: 1,
						// Keep the last successful data visible while a query
						// with a CHANGED key (pagination step, filter, date
						// range) refetches, instead of dropping to a skeleton.
						// Only affects same-observer key changes — a tab switch
						// mounts a fresh observer, so it doesn't show stale
						// cross-entity data. Pair with an isFetching opacity dim.
						placeholderData: keepPreviousData,
					},
					mutations: { retry: 0 },
				},
				mutationCache: new MutationCache({
					onSuccess: (data, _variables, _context, mutation) => {
						const sm = mutation.meta?.successMessage;
						if (!sm) {
							return;
						}
						const message =
							typeof sm === "function"
								? (sm as (data: unknown) => string)(data)
								: (sm as string);
						if (message) {
							toast.success(message);
						}
					},
					onError: (error, _variables, _context, mutation) => {
						if (mutation.meta?.errorMessage === false) {
							return;
						}
						const message =
							(mutation.meta?.errorMessage as string) ||
							error.message ||
							"An error occurred";
						toast.error(message);
					},
				}),
			}),
	);

	return (
		<QueryClientProvider client={client}>
			<AuthNavigationBridge />
			{children}
			{process.env.NODE_ENV === "development" ? (
				<ReactQueryDevtools initialIsOpen={false} />
			) : null}
		</QueryClientProvider>
	);
};
