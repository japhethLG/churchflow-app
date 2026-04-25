"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Wordmark } from "@/components/primitives/Wordmark";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { useLookupInvitation, useAcceptInvitation } from "@/lib/api/invitations";
import { useAuth } from "@/lib/auth/AuthProvider";
import { signInWithGoogle, signOut, refreshSession } from "@/lib/auth/actions";
import { tenantLogoGradient, tenantInitials } from "@/lib/design/logo-gradient";

function daysRemaining(expiresAt: string): number {
  return Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000);
}

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { user: firebaseUser, loading: authLoading } = useAuth();
  const { data: invitation, isLoading, error } = useLookupInvitation(token);
  const { mutateAsync: acceptInvitation, isPending: accepting } = useAcceptInvitation();
  const [dismissed, setDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function handleAccept() {
    setActionError(null);
    try {
      if (!firebaseUser) {
        await signInWithGoogle();
      }
      await acceptInvitation({ params: {}, body: { token } });
      await refreshSession();
      const role = invitation?.role;
      const slug = (invitation as { tenantSlug?: string })?.tenantSlug;
      // Claim flow: route to the welcome onboarding so the user can
      // reconcile the temp profile data with their SSO identity.
      const isClaim = Boolean((invitation as { memberId?: string | null })?.memberId);
      if (slug) {
        if (isClaim && role !== "ADMIN") {
          router.push(`/${slug}/welcome`);
        } else {
          router.push(role === "ADMIN" ? `/${slug}/admin/dashboard` : `/${slug}/member/dashboard`);
        }
      } else {
        router.push("/");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  async function handleSwitchAccount() {
    await signOut();
    window.location.reload();
  }

  const loading = isLoading || authLoading;
  const inv = invitation as typeof invitation & { tenantSlug?: string; tenantName?: string; inviterDisplayName?: string | null } | undefined;

  // Skeleton
  if (loading) {
    return (
      <PageShell>
        <div style={{ height: 18, background: S.surfaceContainer, borderRadius: 6, width: 80, marginBottom: 16 }} />
        <div style={{ height: 32, background: S.surfaceContainer, borderRadius: 8, width: "90%", marginBottom: 8 }} />
        <div style={{ height: 32, background: S.surfaceContainer, borderRadius: 8, width: "70%", marginBottom: 24 }} />
        <div style={{ height: 72, background: S.surfaceContainer, borderRadius: 12 }} />
      </PageShell>
    );
  }

  // Error / invalid token
  if (error || !inv) {
    return (
      <PageShell>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.error, marginBottom: 12 }}>
          Invalid invitation
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: S.onSurface, margin: "0 0 12px" }}>
          This link is no longer valid.
        </h1>
        <p style={{ fontSize: 15, color: S.onSurfaceVariant, marginTop: 0, lineHeight: 1.55 }}>
          This invitation link has expired, been cancelled, or was already accepted. Ask an admin to send you a new invitation.
        </p>
        <div style={{ marginTop: 28 }}>
          <Button variant="secondary" size="lg" fullWidth onClick={() => router.push("/login")}>
            Go to login
          </Button>
        </div>
      </PageShell>
    );
  }

  // Already accepted
  if (inv.status === "ACCEPTED") {
    const slug = inv.tenantSlug;
    return (
      <PageShell>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.tertiary, marginBottom: 12 }}>
          Already accepted
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: S.onSurface, margin: "0 0 12px" }}>
          You&apos;ve already joined{inv.tenantName ? ` ${inv.tenantName}` : ""}.
        </h1>
        <p style={{ fontSize: 15, color: S.onSurfaceVariant, lineHeight: 1.55 }}>
          This invitation has already been accepted.
        </p>
        {slug && (
          <div style={{ marginTop: 28 }}>
            <Button variant="primary" size="lg" fullWidth onClick={() => router.push(inv.role === "ADMIN" ? `/${slug}/admin/dashboard` : `/${slug}/member/dashboard`)}>
              Go to church
            </Button>
          </div>
        )}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>Go to login</Button>
        </div>
      </PageShell>
    );
  }

  // Dismissed (wasn't meant for me)
  if (dismissed) {
    return (
      <PageShell>
        <p style={{ fontSize: 15, color: S.onSurfaceVariant, lineHeight: 1.55, textAlign: "center", paddingTop: 16 }}>
          No problem — simply close this tab.
        </p>
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(false)}>← Go back</Button>
        </div>
      </PageShell>
    );
  }

  // Main valid state
  const { from, to } = tenantLogoGradient(inv.tenantSlug ?? inv.tenantId);
  const days = daysRemaining(inv.expiresAt);
  const busy = accepting;

  return (
    <PageShell>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.tertiary, marginBottom: 12 }}>
        Invitation
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.025em", color: S.onSurface, margin: 0, lineHeight: 1.2 }}>
        You&apos;ve been invited to{" "}
        <span style={{ background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {inv.tenantName ?? "a church"}
        </span>
        .
      </h1>
      <p style={{ fontSize: 15, color: S.onSurfaceVariant, marginTop: 14, lineHeight: 1.55 }}>
        {inv.inviterDisplayName ?? "An admin"} invited you to join as a{" "}
        <strong style={{ color: S.onSurface }}>{inv.role === "ADMIN" ? "Admin" : "Member"}</strong>. Sign in with Google to accept.
      </p>

      <div style={{ display: "flex", gap: 16, marginTop: 28, padding: 16, background: S.surfaceContainerLow, borderRadius: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${from}, ${to})`, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
            {tenantInitials(inv.tenantName ?? "")}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.tenantName ?? "—"}</div>
            <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>{inv.email}</div>
          </div>
        </div>
        {inv.inviterDisplayName && (
          <>
            <div style={{ width: 1, background: S.surfaceContainer }} />
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
              <Avatar name={inv.inviterDisplayName} size={36} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{inv.inviterDisplayName}</div>
                <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>Admin</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Already signed in — show who will accept */}
      {firebaseUser && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: S.surfaceContainerLow, borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
          <Avatar name={firebaseUser.displayName ?? firebaseUser.email ?? "?"} src={firebaseUser.photoURL ?? undefined} size={28} />
          <span style={{ color: S.onSurfaceVariant, flex: 1 }}>
            Accepting as <strong style={{ color: S.onSurface }}>{firebaseUser.displayName ?? firebaseUser.email}</strong>
          </span>
          <button onClick={handleSwitchAccount} style={{ background: "none", border: "none", fontSize: 12, color: S.primary, cursor: "pointer", padding: 0 }}>
            Switch
          </button>
        </div>
      )}

      {actionError && (
        <p style={{ marginTop: 12, fontSize: 13, color: S.error }}>{actionError}</p>
      )}

      <div style={{ marginTop: 20 }}>
        <Button variant="primary" size="lg" fullWidth icon={firebaseUser ? undefined : "google"} disabled={busy} onClick={handleAccept}>
          {firebaseUser ? "Accept invitation" : "Accept & Continue with Google"}
        </Button>
      </div>

      <div style={{ marginTop: 16, fontSize: 13, color: S.onSurfaceMuted, textAlign: "center", cursor: "pointer" }} onClick={() => setDismissed(true)}>
        This wasn&apos;t meant for me
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: S.onSurfaceMuted, textAlign: "center" }}>
        {days > 0 ? `Invitation expires in ${days} day${days === 1 ? "" : "s"}.` : "Invitation expires today."}
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div style={{ padding: "28px 40px" }}>
        <Wordmark />
      </div>
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ width: 480, background: S.surfaceContainerLowest, borderRadius: 24, padding: 40 }}>
          {children}
        </div>
      </div>
    </>
  );
}
