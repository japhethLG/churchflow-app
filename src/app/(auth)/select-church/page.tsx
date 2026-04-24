import Link from "next/link";
import { redirect } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Wordmark } from "@/components/primitives/Wordmark";
import { Badge } from "@/components/primitives/Badge";
import { getSessionUser } from "@/lib/auth/server";

export default async function SelectChurchPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const memberships = Object.entries(user.tenantMemberships).map(([slug, m]) => ({
    slug,
    role: m.role,
  }));

  // Single-membership short-circuit: let `/` handle it.
  if (memberships.length === 1 && !user.isSuperAdmin) {
    const [{ slug, role }] = memberships;
    redirect(
      role === "ADMIN" ? `/${slug}/admin/dashboard` : `/${slug}/member/dashboard`,
    );
  }

  return (
    <>
      <div style={{ padding: "28px 40px" }}>
        <Wordmark />
      </div>
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 40 }}>
        <div style={{ width: 720 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              margin: 0,
              textAlign: "center",
            }}
          >
            {memberships.length === 0 ? "No churches yet" : "Which church today?"}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: S.onSurfaceVariant,
              marginTop: 10,
              textAlign: "center",
            }}
          >
            {memberships.length === 0
              ? "You're signed in, but haven't been added to a church yet. Ask your pastor to send you an invitation."
              : "Pick the church you want to act in."}
          </p>

          {memberships.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: memberships.length > 1 ? "1fr 1fr" : "1fr",
                gap: 16,
                marginTop: 32,
              }}
            >
              {memberships.map(({ slug, role }) => (
                <Link
                  key={slug}
                  href={
                    role === "ADMIN"
                      ? `/${slug}/admin/dashboard`
                      : `/${slug}/member/dashboard`
                  }
                  style={{
                    background: S.surfaceContainerLowest,
                    borderRadius: 16,
                    padding: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    textDecoration: "none",
                    color: S.onSurface,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
                      display: "grid",
                      placeItems: "center",
                      color: "#fff",
                      fontWeight: 600,
                    }}
                  >
                    {slug.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>
                      {slug}
                    </div>
                    <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 4 }}>
                      /{slug}
                    </div>
                  </div>
                  <Badge color={role === "ADMIN" ? "indigo" : "gray"}>
                    {role === "ADMIN" ? "Admin" : "Member"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}

          {user.isSuperAdmin && (
            <div
              style={{
                marginTop: 32,
                padding: 20,
                borderRadius: 12,
                background: S.surfaceContainerLow,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 13, color: S.onSurfaceMuted, marginBottom: 8 }}>
                You're a platform admin.
              </div>
              <Link
                href="/super-admin/tenants"
                style={{
                  color: S.primary,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Go to platform ops →
              </Link>
            </div>
          )}

          <div
            style={{
              fontSize: 12,
              color: S.onSurfaceMuted,
              textAlign: "center",
              marginTop: 24,
            }}
          >
            You can switch churches anytime from the sidebar.
          </div>
        </div>
      </div>
    </>
  );
}
