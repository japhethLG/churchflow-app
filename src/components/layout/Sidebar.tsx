"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon, type IconName } from "@/components/primitives/Icon";
import { Avatar } from "@/components/primitives/Avatar";
import { signOut } from "@/lib/auth/actions";

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
  ];
}

export function Sidebar({
  perspective,
  tenantSlug,
  churchName,
  userName,
  userEmail,
  memberships = [],
  isSuperAdmin = false,
}: {
  perspective: Perspective;
  tenantSlug?: string;
  churchName?: string;
  userName: string;
  userEmail?: string;
  memberships?: TenantSummary[];
  isSuperAdmin?: boolean;
}) {
  const pathname = usePathname();
  const items = buildNav(perspective, tenantSlug);

  return (
    <div
      style={{
        width: 260,
        height: "100vh",
        position: "sticky",
        top: 0,
        background: S.surfaceContainerLowest,
        padding: "24px 16px 16px",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        borderRight: `1px solid ${S.outlineVariant}22`,
      }}
    >
      {/* ── Brand header ── */}
      <BrandHeader
        perspective={perspective}
        churchName={churchName ?? "ChurchFlow"}
      />

      {/* ── Navigation ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, overflow: "auto" }}>
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
                transition: "background 0.15s ease",
              }}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* ── Account section ── */}
      <AccountMenu
        perspective={perspective}
        tenantSlug={tenantSlug}
        userName={userName}
        userEmail={userEmail}
        memberships={memberships}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Brand header
   ───────────────────────────────────────────────────── */
function BrandHeader({
  perspective,
  churchName,
}: {
  perspective: Perspective;
  churchName: string;
}) {
  const initials = churchName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isPlatform = perspective === "super";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "4px 6px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: isPlatform
            ? `linear-gradient(135deg, ${S.tertiary}, ${S.warning})`
            : `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
          display: "grid",
          placeItems: "center",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {isPlatform ? "⚡" : initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: S.onSurface,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            letterSpacing: "-0.01em",
          }}
        >
          {isPlatform ? "Platform" : churchName}
        </div>
        <div style={{ fontSize: 11, color: S.onSurfaceMuted, fontWeight: 500 }}>
          {perspectiveLabel(perspective)}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Account menu — avatar trigger + dropdown with
   flyout submenus for Admin / Member
   ───────────────────────────────────────────────────── */
function AccountMenu({
  perspective,
  tenantSlug,
  userName,
  userEmail,
  memberships,
  isSuperAdmin,
}: {
  perspective: Perspective;
  tenantSlug?: string;
  userName: string;
  userEmail?: string;
  memberships: TenantSummary[];
  isSuperAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [flyout, setFlyout] = useState<"admin" | "member" | null>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const flyoutTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFlyout(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function closeAll() {
    setOpen(false);
    setFlyout(null);
  }

  // Debounced flyout open/close for smooth hover
  function openFlyout(which: "admin" | "member") {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
    setFlyout(which);
  }
  function scheduleFlyoutClose() {
    flyoutTimeout.current = setTimeout(() => setFlyout(null), 200);
  }
  function cancelFlyoutClose() {
    if (flyoutTimeout.current) clearTimeout(flyoutTimeout.current);
  }

  async function handleSignOut() {
    closeAll();
    await signOut();
    router.push("/login");
  }

  const adminTenants = memberships.filter((m) => m.role === "ADMIN");
  const memberTenants = memberships;

  const profileHref = tenantSlug
    ? `/${tenantSlug}/member/profile`
    : memberships.length > 0
      ? `/${memberships[0].slug}/member/profile`
      : null;

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (open) setFlyout(null);
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 12,
          background: open ? S.surfaceContainer : S.surfaceContainerLow,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          transition: "background 0.15s ease",
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
          <div style={{ fontSize: 11, color: S.onSurfaceMuted }}>
            {perspectiveLabel(perspective)}
          </div>
        </div>
        <Icon
          name="chevronDown"
          size={14}
          color={S.onSurfaceMuted}
          style={{
            flexShrink: 0,
            transition: "transform 0.2s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: S.surfaceContainerLowest,
            borderRadius: 14,
            padding: 6,
            boxShadow:
              "0 -4px 6px rgba(0,0,0,0.03), 0 -12px 28px rgba(0,0,0,0.08)",
            zIndex: 50,
          }}
        >
          {/* User info */}
          <div
            style={{
              padding: "10px 10px 8px",
              borderBottom: `1px solid ${S.outlineVariant}44`,
              marginBottom: 4,
            }}
          >
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
            {userEmail && (
              <div
                style={{
                  fontSize: 11,
                  color: S.onSurfaceMuted,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  marginTop: 1,
                }}
              >
                {userEmail}
              </div>
            )}
          </div>

          {/* Profile */}
          {profileHref && (
            <MenuLink icon="user" label="Profile" href={profileHref} onClick={closeAll} />
          )}

          <MenuDivider />
          <SectionLabel>Switch context</SectionLabel>

          {/* Platform */}
          {isSuperAdmin && (
            <MenuLink
              icon="chart"
              label="Platform"
              href="/super-admin/tenants"
              active={perspective === "super"}
              accent={S.tertiary}
              onClick={closeAll}
            />
          )}

          {/* Admin — flyout trigger */}
          {adminTenants.length > 0 && (
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => openFlyout("admin")}
              onMouseLeave={scheduleFlyoutClose}
            >
              <FlyoutTriggerRow
                icon="settings"
                label="Admin"
                active={perspective === "admin"}
                isOpen={flyout === "admin"}
                onClick={() => setFlyout((v) => (v === "admin" ? null : "admin"))}
              />
              {flyout === "admin" && (
                <FlyoutPanel
                  onMouseEnter={cancelFlyoutClose}
                  onMouseLeave={scheduleFlyoutClose}
                >
                  <SectionLabel>Select church</SectionLabel>
                  {adminTenants.map((m) => (
                    <TenantLink
                      key={m.slug}
                      name={m.name}
                      href={`/${m.slug}/admin/dashboard`}
                      active={perspective === "admin" && tenantSlug === m.slug}
                      onClick={closeAll}
                    />
                  ))}
                </FlyoutPanel>
              )}
            </div>
          )}

          {/* Member — flyout trigger */}
          {memberTenants.length > 0 && (
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => openFlyout("member")}
              onMouseLeave={scheduleFlyoutClose}
            >
              <FlyoutTriggerRow
                icon="user"
                label="Member"
                active={perspective === "member"}
                isOpen={flyout === "member"}
                onClick={() => setFlyout((v) => (v === "member" ? null : "member"))}
              />
              {flyout === "member" && (
                <FlyoutPanel
                  onMouseEnter={cancelFlyoutClose}
                  onMouseLeave={scheduleFlyoutClose}
                >
                  <SectionLabel>Select church</SectionLabel>
                  {memberTenants.map((m) => (
                    <TenantLink
                      key={m.slug}
                      name={m.name}
                      href={`/${m.slug}/member/dashboard`}
                      active={perspective === "member" && tenantSlug === m.slug}
                      onClick={closeAll}
                    />
                  ))}
                </FlyoutPanel>
              )}
            </div>
          )}

          {/* Logout */}
          <MenuDivider />
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 10px",
              borderRadius: 8,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 500,
              color: S.error,
              textAlign: "left",
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = `${S.errorContainer}88`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Flyout trigger row — the menu item that spawns
   a flyout panel to the right on hover / click
   ───────────────────────────────────────────────────── */
function FlyoutTriggerRow({
  icon,
  label,
  active,
  isOpen,
  onClick,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 8,
        background: isOpen
          ? S.surfaceContainerLow
          : active
            ? S.primaryFixed
            : "transparent",
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? S.primary : S.onSurface,
        textAlign: "left",
        transition: "background 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!active && !isOpen)
          e.currentTarget.style.background = S.surfaceContainerLow;
      }}
      onMouseLeave={(e) => {
        if (!active && !isOpen)
          e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon
        name={icon}
        size={16}
        color={active ? S.primary : S.onSurfaceVariant}
      />
      <span style={{ flex: 1 }}>{label}</span>
      {active && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: S.primary,
            background: S.primaryFixed,
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          Active
        </span>
      )}
      <Icon
        name="chevronRight"
        size={12}
        color={S.onSurfaceMuted}
        style={{ flexShrink: 0 }}
      />
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   Flyout panel — pops out to the right of the
   parent dropdown, showing child tenants
   ───────────────────────────────────────────────────── */
function FlyoutPanel({
  children,
  onMouseEnter,
  onMouseLeave,
}: {
  children: React.ReactNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: "absolute",
        left: "calc(100% + 6px)",
        bottom: 0,
        minWidth: 200,
        maxWidth: 240,
        background: S.surfaceContainerLowest,
        borderRadius: 12,
        padding: 6,
        boxShadow:
          "0 4px 6px rgba(0,0,0,0.04), 0 10px 24px rgba(0,0,0,0.1)",
        zIndex: 60,
        animation: "flyoutIn 0.15s ease",
      }}
    >
      <style>{`
        @keyframes flyoutIn {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Tenant link — a single church inside a flyout
   ───────────────────────────────────────────────────── */
function TenantLink({
  name,
  href,
  active,
  onClick,
}: {
  name: string;
  href: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? S.primary : S.onSurface,
        textDecoration: "none",
        transition: "background 0.12s ease",
        background: active ? `${S.primaryFixed}66` : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = S.surfaceContainerLow;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = "transparent";
      }}
    >
      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          flex: 1,
        }}
      >
        {name}
      </span>
      {active && (
        <Icon
          name="check"
          size={14}
          color={S.primary}
          style={{ flexShrink: 0 }}
        />
      )}
    </Link>
  );
}

/* ─── Shared sub-components ─── */

function MenuLink({
  icon,
  label,
  href,
  onClick,
  accent,
  active,
}: {
  icon: IconName;
  label: string;
  href: string;
  onClick?: () => void;
  accent?: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        color: active ? (accent ?? S.primary) : (accent ?? S.onSurface),
        background: active ? S.primaryFixed : "transparent",
        textDecoration: "none",
        transition: "background 0.12s ease",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = S.surfaceContainerLow;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = active ? S.primaryFixed : "transparent";
      }}
    >
      <Icon
        name={icon}
        size={16}
        color={active ? (accent ?? S.primary) : (accent ?? S.onSurfaceVariant)}
      />
      <span style={{ flex: 1 }}>{label}</span>
      {active && (
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: accent ?? S.primary,
            background: S.primaryFixed,
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          Active
        </span>
      )}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: S.onSurfaceMuted,
        padding: "8px 10px 4px",
      }}
    >
      {children}
    </div>
  );
}

function MenuDivider() {
  return (
    <div
      style={{
        height: 1,
        background: S.outlineVariant,
        opacity: 0.35,
        margin: "4px 8px",
      }}
    />
  );
}

function perspectiveLabel(p: Perspective): string {
  return p === "super" ? "Super Admin" : p === "admin" ? "Admin" : "Member";
}
