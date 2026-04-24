import { SANCTUARY as S } from "@/lib/design/tokens";
import { Wordmark } from "@/components/primitives/Wordmark";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await params;
  return (
    <>
      <div style={{ padding: "28px 40px" }}>
        <Wordmark />
      </div>
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ width: 480, background: S.surfaceContainerLowest, borderRadius: 24, padding: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.tertiary, marginBottom: 12 }}>
            Invitation
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-0.025em", color: S.onSurface, margin: 0, lineHeight: 1.2 }}>
            You&apos;ve been invited to{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Grace Community Church
            </span>
            .
          </h1>
          <p style={{ fontSize: 15, color: S.onSurfaceVariant, marginTop: 14, lineHeight: 1.55 }}>
            Pastor David Obi invited you to join as a{" "}
            <strong style={{ color: S.onSurface }}>Member</strong>. Sign in with Google to accept and see
            the gifts Grace Community has recorded for you.
          </p>

          <div style={{ display: "flex", gap: 16, marginTop: 28, padding: 16, background: S.surfaceContainerLow, borderRadius: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                GC
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Grace Community</div>
                <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>hello@gracecommunity.org</div>
              </div>
            </div>
            <div style={{ width: 1, background: S.surfaceContainer }} />
            <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
              <Avatar name="David Obi" size={36} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>David Obi</div>
                <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>Pastor · Admin</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <Button variant="primary" size="lg" fullWidth icon="google">
              Accept &amp; Continue with Google
            </Button>
          </div>

          <div style={{ marginTop: 16, fontSize: 13, color: S.onSurfaceMuted, textAlign: "center" }}>
            This wasn&apos;t meant for me
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: S.onSurfaceMuted, textAlign: "center" }}>
            Invitation expires in 6 days.
          </div>
        </div>
      </div>
    </>
  );
}
