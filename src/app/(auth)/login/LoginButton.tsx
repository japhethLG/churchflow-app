"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/primitives";
import {
	completeRedirectSignIn,
	isAuthCancellationError,
	signInWithGoogle,
} from "@/lib/auth/actions";

// After sign-in, let /launch decide where to send the user. The
// post-login redirect already knows the rules (super-admin →
// /super-admin/tenants, 0 memberships → /select-church, 1 →
// /[slug]/(admin|member)/dashboard, >1 → /select-church) so we don't
// duplicate them here. `/` is now the public landing page and never
// auto-redirects, so we don't bounce through it any more.
export const LoginButton = () => {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Standalone/TWA sign-in uses a full-page redirect; finalize it when the
	// app reloads back here. No-op when no redirect is pending.
	useEffect(() => {
		let active = true;
		setLoading(true);
		completeRedirectSignIn()
			.then((result) => {
				if (active && result) {
					router.push("/launch");
					router.refresh();
				}
			})
			.catch((err) => {
				if (active && !isAuthCancellationError(err)) {
					console.error(err);
					setError(err instanceof Error ? err.message : "Sign-in failed");
				}
			})
			.finally(() => {
				if (active) {
					setLoading(false);
				}
			});
		return () => {
			active = false;
		};
	}, [router]);

	const handleClick = async () => {
		setLoading(true);
		setError(null);
		try {
			// In standalone/TWA this redirects away and resolves null; the
			// effect above completes sign-in after the redirect returns.
			const result = await signInWithGoogle();
			if (result) {
				router.push("/launch");
				router.refresh();
			}
		} catch (err) {
			if (isAuthCancellationError(err)) {
				return;
			}
			console.error(err);
			setError(err instanceof Error ? err.message : "Sign-in failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Button
				role="primary"
				size="lg"
				fullWidth
				icon="google"
				onClick={handleClick}
				disabled={loading}
			>
				{loading ? "Signing in…" : "Continue with Google"}
			</Button>
			{error && (
				<div className="mt-3 text-center text-xs text-destructive">{error}</div>
			)}
		</>
	);
};
