import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Sidebar, type Perspective, type TenantSummary } from "./Sidebar";
import { TopBar } from "./TopBar";

export const AppShell = ({
  perspective,
  tenantSlug,
  breadcrumb,
  churchName,
  userName,
  userEmail,
  memberships,
  isSuperAdmin,
  children,
  contentPad = 32,
  bg,
}: {
  perspective: Perspective;
  tenantSlug?: string;
  breadcrumb?: string;
  churchName?: string;
  userName: string;
  userEmail?: string;
  memberships?: TenantSummary[];
  isSuperAdmin?: boolean;
  children: ReactNode;
  contentPad?: number;
  bg?: string;
}) => {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        background: bg || S.surface,
        fontFamily: "Inter, system-ui, sans-serif",
        color: S.onSurface,
      }}
    >
      <Sidebar
        perspective={perspective}
        tenantSlug={tenantSlug}
        churchName={churchName}
        userName={userName}
        userEmail={userEmail}
        memberships={memberships}
        isSuperAdmin={isSuperAdmin}
      />
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <TopBar breadcrumb={breadcrumb} />
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: `0 ${contentPad}px ${contentPad}px`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
