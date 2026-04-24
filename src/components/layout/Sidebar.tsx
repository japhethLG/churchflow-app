"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon, type IconName } from "@/components/primitives/Icon";
import { Avatar } from "@/components/primitives/Avatar";

type NavItem = { icon: IconName; label: string; href: string };

// Perspective governs which nav tree renders + the URL shape.
// "admin"  → /[slug]/admin/…
// "member" → /[slug]/member/…
// "super"  → /super-admin/…
export type Perspective = "admin" | "member" | "super";

export type TenantSummary = {
  slug: string;
  name: string;
  role: "ADMIN" | "USER";
};

function buildNav(perspective: Perspective, tenantSlug?: string): NavItem[] {
  if (perspective === "super") {
    return [
      { icon: "home", label: "Tenants", href: "/super-admin/tenants" },
      { icon: "users", label: "Admins", href: "/super-admin/admins" },
      { icon: "chart", label: "Audit log", href: "/super-admin/audit" },
    ];
  }

  // Admin and member navs need a tenant slug to build URLs.
  const prefix = `/${tenantSlug}`;

  if (perspective === "admin") {
    return [
      { icon: "home", label: "Dashboard", href: `${prefix}/admin/dashboard` },
      { icon: "users", label: "Members", href: `${prefix}/admin/members` },
      { icon: "calendar", label: "Campaigns", href: `${prefix}/admin/campaigns` },
      { icon: "book", label: "Pledges", href: `${prefix}/admin/pledges` },
      { icon: "receipt", label: "Transactions", href: `${prefix}/admin/transactions` },
      { icon: "chart", label: "Reports", href: `${prefix}/admin/reports` },
      { icon: "mail", label: "Invitations", href: `${prefix}/admin/invitations` },
      { icon: "settings", label: "Settings", href: `${prefix}/admin/settings` },
    ];
  }

  return [
    { icon: "home", label: "Dashboard", href: `${prefix}/member/dashboard` },
    { icon: "calendar", label: "Campaigns", href: `${prefix}/member/campaigns` },
    { icon: "book", label: "My pledges", href: `${prefix}/member/my-pledges` },
    { icon: "receipt", label: "My giving", href: `${prefix}/member/my-transactions` },
    { icon: "user", label: "Profile", href: `${prefix}/member/profile` },
  ];
}

export function Sidebar({
  perspective,
  tenantSlug,
  churchName,
  userName,
  memberships = [],
  isSuperAdmin = false,
}: {
  perspective: Perspective;
  tenantSlug?: string;
  churchName?: string;
  userName: string;
  memberships?: TenantSummary[];
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = buildNav(perspective, tenantSlug);
  const roleLabel =
    perspective === "admin" ? "Admin" : perspective === "super" ? "Super" : "Member";

  return (
    <div
      style={{
        width: 260,
        height: "100%",
        background: S.surfaceContainerLowest,
        padding: "24px 16px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      <TenantSwitcher
        perspective={perspective}
        tenantSlug={tenantSlug}
        churchName={churchName ?? "ChurchFlow"}
        memberships={memberships}
        isSuperAdmin={isSuperAdmin}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 9999,
                background: active ? S.primaryFixed : "transparent",
                color: active ? S.primary : S.onSurfaceVariant,
                fontSize: 14,
                fontWeight: active ? 600 : 500,
                letterSpacing: "-0.005em",
                textDecoration: "none",
              }}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}

        {/* Admins can flip to member-perspective to pledge as themselves
            or see their own giving history. One nav link, no mode toggle. */}
        {perspective === "admin" && tenantSlug && (
          <Link
            href={`/${tenantSlug}/member/dashboard`}
            style={{
              marginTop: 12,
              padding: "10px 14px",
              borderRadius: 9999,
              color: S.onSurfaceMuted,
              fontSize: 12,
              fontWeight: 500,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Icon name="user" size={14} />
            View as member
          </Link>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 12,
          background: S.surfaceContainerLow,
          marginTop: 16,
        }}
      >
        <Avatar name={userName} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: S.onSurface,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {userName}
          </div>
          <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>{roleLabel}</div>
        </div>
      </div>
    </div>
  );
}

// Tenant switcher — a dropdown menu of Links. Switching tenants is just
// navigation; there is no switch-tenant mutation. The menu also carries
// the super-admin "Platform ops" entry when applicable.
function TenantSwitcher({
  perspective,
  tenantSlug,
  churchName,
  memberships,
  isSuperAdmin,
}: {
  perspective: Perspective;
  tenantSlug?: string;
  churchName: string;
  memberships: TenantSummary[];
  isSuperAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const showSuperAdminEntry = isSuperAdmin && perspective !== "super";
  const showTenantsInSuperView = isSuperAdmin && perspective === "super";
  const nothingToSwitch =
    memberships.length <= 1 && !showSuperAdminEntry && !showTenantsInSuperView;

  return (
    <div style={{ position: "relative", marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => !nothingToSwitch && setOpen((v) => !v)}
        disabled={nothingToSwitch}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 12,
          background: S.surfaceContainerLow,
          border: "none",
          cursor: nothingToSwitch ? "default" : "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
            display: "grid",
            placeItems: "center",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {churchName
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: S.onSurface,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {churchName}
          </div>
          <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
            {nothingToSwitch ? roleSubtitle(perspective) : "Switch"}
          </div>
        </div>
        {!nothingToSwitch && <Icon name="chevronDown" size={16} color={S.onSurfaceMuted} />}
      </button>

      {open && !nothingToSwitch && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: S.surfaceContainerLowest,
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
            zIndex: 30,
          }}
        >
          {memberships
            .filter((m) => m.slug !== tenantSlug || perspective === "super")
            .map((m) => (
              <Link
                key={m.slug}
                href={`/${m.slug}/${m.role === "ADMIN" ? "admin" : "member"}/dashboard`}
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 13,
                  color: S.onSurface,
                  textDecoration: "none",
                }}
              >
                <div style={{ fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
                  {m.role === "ADMIN" ? "Admin" : "Member"}
                </div>
              </Link>
            ))}
          {showSuperAdminEntry && (
            <>
              {memberships.length > 0 && (
                <div
                  style={{
                    height: 1,
                    background: S.outlineVariant,
                    margin: "6px 8px",
                  }}
                />
              )}
              <Link
                href="/super-admin/tenants"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 13,
                  color: S.tertiary,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Platform ops
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function roleSubtitle(p: Perspective): string {
  return p === "super" ? "Platform" : p === "admin" ? "Admin view" : "Member view";
}
