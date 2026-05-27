"use client";

import { useState } from "react";
import { openModal } from "@/lib/modals/store";
import { buildNav } from "../sidebar/buildNav";
import type { Perspective, TenantSummary } from "../sidebar/types";
import { AccountSheet } from "./AccountSheet";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileTopBar } from "./MobileTopBar";
import { MoreSheet } from "./MoreSheet";

type Sheet = "account" | "more" | null;

/**
 * Mobile-only chrome: a top app bar (rendered in flow, above the scroll
 * area) plus a fixed bottom nav, and the sheets they trigger. Hidden at
 * `md` and up, where the desktop Sidebar + TopBar take over. Owns the
 * shared open-state so the top bar and bottom nav can each raise a sheet.
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
	const [sheet, setSheet] = useState<Sheet>(null);

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
				onAccount={() => setSheet("account")}
			/>

			<MobileBottomNav
				className="md:hidden"
				items={primary}
				onRecordGift={
					isAdmin && tenantSlug
						? () => openModal("record-gift", { tenantSlug })
						: undefined
				}
				onMore={overflow.length > 0 ? () => setSheet("more") : undefined}
			/>

			<AccountSheet
				open={sheet === "account"}
				onOpenChange={(o) => setSheet(o ? "account" : null)}
				perspective={perspective}
				tenantSlug={tenantSlug}
				userName={userName}
				userEmail={userEmail}
				memberships={memberships}
				isSuperAdmin={isSuperAdmin}
			/>

			<MoreSheet
				open={sheet === "more"}
				onOpenChange={(o) => setSheet(o ? "more" : null)}
				items={overflow}
			/>
		</>
	);
};
