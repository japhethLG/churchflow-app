"use client";

import { openSheet } from "@/lib/sheets/store";
import { buildNav } from "../sidebar/buildNav";
import type { Perspective, TenantSummary } from "../sidebar/types";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileTopBar } from "./MobileTopBar";

/**
 * Mobile-only chrome: a top app bar (rendered in flow, above the scroll
 * area) plus a fixed bottom nav. Hidden at `md` and up, where the desktop
 * Sidebar + TopBar take over. Sheets (account, more) are opened via the
 * shared sheet host — see `@/lib/sheets/store`.
 */
export const MobileChrome = ({
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
	churchName: string;
	userName: string;
	userEmail?: string;
	memberships?: TenantSummary[];
	isSuperAdmin?: boolean;
}) => {
	const navItems = buildNav(perspective, tenantSlug);
	const primary = navItems.slice(0, 4);
	const overflow = navItems.slice(4);

	const isAdmin = perspective === "admin";

	return (
		<>
			<MobileTopBar
				className="md:hidden"
				churchName={churchName}
				perspective={perspective}
				onAccount={() =>
					openSheet("account", {
						perspective,
						tenantSlug,
						userName,
						userEmail,
						memberships,
						isSuperAdmin,
					})
				}
			/>

			<MobileBottomNav
				className="md:hidden"
				items={primary}
				onRecordGift={
					isAdmin && tenantSlug
						? () => openSheet("record-gift", { tenantSlug })
						: undefined
				}
				onMore={
					overflow.length > 0
						? () => openSheet("more", { items: overflow })
						: undefined
				}
			/>
		</>
	);
};
