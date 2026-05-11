"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/primitives";
import { signInWithGoogle } from "@/lib/auth/actions";

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

	const handleClick = async () => {
		setLoading(true);
		setError(null);
		try {
			await signInWithGoogle();
			router.push("/launch");
			router.refresh();
		} catch (err) {
			console.error(err);
			setError(err instanceof Error ? err.message : "Sign-in failed");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<Button
				variant="primary"
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
