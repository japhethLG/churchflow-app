import { SANCTUARY as S } from "@/lib/design/tokens";
import { Wordmark } from "@/components/primitives/Wordmark";
import { JournalIllustration } from "@/components/illustrations/JournalIllustration";
import { LoginButton } from "./LoginButton";

export default function LoginPage() {
  return (
    <>
      <div style={{ padding: "28px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark size="md" />
      </div>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", padding: "0 40px", gap: 40 }}>
        <div style={{ justifySelf: "center", width: 440 }}>
          <div style={{ background: S.surfaceContainerLowest, borderRadius: 24, padding: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.onSurfaceMuted, marginBottom: 12 }}>
              Sign in
            </div>
            <h1 style={{ fontSize: 36, fontWeight: 600, letterSpacing: "-0.025em", color: S.onSurface, margin: 0, lineHeight: 1.1 }}>
              Welcome back.
            </h1>
            <p style={{ fontSize: 15, color: S.onSurfaceVariant, marginTop: 12, lineHeight: 1.55 }}>
              Sign in to your church&apos;s dashboard. Your giving history and upcoming services will be right where you left them.
            </p>

            <div style={{ marginTop: 32 }}>
              <LoginButton />
            </div>

            <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 20, lineHeight: 1.5, textAlign: "center" }}>
              By continuing you agree to our{" "}
              <span style={{ textDecoration: "underline", color: S.onSurfaceVariant }}>Terms</span> and{" "}
              <span style={{ textDecoration: "underline", color: S.onSurfaceVariant }}>Privacy Policy</span>.
            </div>
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: S.onSurfaceMuted, textAlign: "center" }}>
            New to ChurchFlow? Ask your church administrator for an invite.
          </div>
        </div>
        <div style={{ justifySelf: "center", width: 440, height: 440, position: "relative" }}>
          <JournalIllustration />
        </div>
      </div>
      <div style={{ padding: "24px 40px", display: "flex", justifyContent: "space-between", fontSize: 12, color: S.onSurfaceMuted }}>
        <span>Built for churches.</span>
        <span style={{ display: "flex", gap: 20 }}>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </span>
      </div>
    </>
  );
}
