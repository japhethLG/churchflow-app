"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setLoginRedirector } from "@/lib/api/client";

// Bridges the typed API client (a plain module, no React context) to the
// router + query cache. The client's 401 handler calls the registered
// redirector instead of `window.location` so a session lapse becomes a soft
// SPA navigation: clear the now-forbidden query cache, then router.replace to
// /login — no full document reload / re-hydration. Must render under the
// QueryClientProvider so useQueryClient resolves.
export const AuthNavigationBridge = (): null => {
	const router = useRouter();
	const queryClient = useQueryClient();

	useEffect(() => {
		setLoginRedirector((next) => {
			queryClient.clear();
			router.replace(`/login?next=${next}`);
		});
		return () => setLoginRedirector(null);
	}, [router, queryClient]);

	return null;
};
