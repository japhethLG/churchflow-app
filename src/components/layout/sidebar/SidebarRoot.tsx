"use client";

import { BrandHeader } from "./BrandHeader";
import { buildNav } from "./buildNav";
import { AccountMenu } from "./account-menu";
import { SidebarNav } from "./SidebarNav";
import type { Perspective, TenantSummary } from "./types";

export type { Perspective, TenantSummary } from "./types";

export const Sidebar = ({
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
}) => {
  const items = buildNav(perspective, tenantSlug);

  return (
    <div className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-card px-4 pb-4 pt-6">
      <BrandHeader
        perspective={perspective}
        churchName={churchName ?? "ChurchFlow"}
      />

      <SidebarNav items={items} />

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
};
