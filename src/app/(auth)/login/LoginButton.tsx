"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives";
import { signInWithGoogle } from "@/lib/auth/actions";

// After sign-in, let `/` decide where to send the user. The landing
// redirect already knows the rules (super-admin → /super-admin/tenants,
// 0 memberships → /select-church, 1 → /[slug]/(admin|member)/dashboard,
// >1 → /select-church) so we don't duplicate them here.
export const LoginButton = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setLoading(false);
    }
  }

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
        <div className="mt-3 text-center text-xs text-destructive">
          {error}
        </div>
      )}
    </>
  );
}
