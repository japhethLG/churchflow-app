"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Icon } from "@/components/primitives/Icon";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { signOut, signOutEverywhere } from "@/lib/auth/actions";
import { openModal } from "@/lib/modals/store";
import type { Perspective, TenantSummary } from "../types";
import { AccountIdentityHeader } from "./AccountIdentityHeader";
import { AccountMenuSectionLabel } from "./AccountMenuSectionLabel";
import { AccountMenuTrigger } from "./AccountMenuTrigger";
import { PlatformMenuItem } from "./PlatformMenuItem";
import { profileHrefFor } from "./routes";
import { TenantRoleSubmenu } from "./TenantRoleSubmenu";

export const AccountMenu = ({
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
}) => {
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);

	const adminTenants = memberships.filter((m) => m.role === "ADMIN");
	const memberTenants = memberships;

	const profileHref = profileHrefFor(perspective, tenantSlug);

	const handleSignOut = async () => {
		await signOut();
		router.push("/login");
	};

	const handleSignOutEverywhere = () => {
		openModal("confirm-delete", {
			title: "Sign out of all devices?",
			message:
				"This signs you out of every browser and device, including this one. You'll need to sign in again on each.",
			confirmLabel: "Sign out everywhere",
			onConfirm: async () => {
				await signOutEverywhere();
				router.push("/login");
			},
		});
	};

	const goTenant = (slug: string, dash: "admin" | "member") => {
		router.push(`/${slug}/${dash}/dashboard`);
	};

	return (
		<DropdownMenu onOpenChange={setMenuOpen}>
			<DropdownMenuTrigger
				render={
					<AccountMenuTrigger
						userName={userName}
						perspective={perspective}
						menuOpen={menuOpen}
					/>
				}
			/>
			<DropdownMenuContent
				side="top"
				align="start"
				sideOffset={6}
				className="z-50 w-[var(--anchor-width)] min-w-[200px] rounded-[14px] border-0 bg-card p-1.5 shadow-[0_-4px_6px_rgba(0,0,0,0.03),0_-12px_28px_rgba(0,0,0,0.08)]"
			>
				<AccountIdentityHeader userName={userName} userEmail={userEmail} />

				<DropdownMenuItem
					className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-[9px] text-[13px] font-medium text-primary [&_svg]:text-primary"
					onClick={() => router.push(profileHref)}
				>
					<Icon name="user" size={16} className="shrink-0 text-primary" />
					<span className="flex-1">Profile</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator className="my-1" />

				<AccountMenuSectionLabel>Switch context</AccountMenuSectionLabel>

				{isSuperAdmin && (
					<PlatformMenuItem
						perspective={perspective}
						onSelect={() => router.push("/super-admin/tenants")}
					/>
				)}

				{adminTenants.length > 0 && (
					<TenantRoleSubmenu
						accountType="admin"
						tenants={adminTenants}
						perspective={perspective}
						tenantSlug={tenantSlug}
						onPickTenant={(slug, dash) => goTenant(slug, dash)}
					/>
				)}

				{memberTenants.length > 0 && (
					<TenantRoleSubmenu
						accountType="member"
						tenants={memberTenants}
						perspective={perspective}
						tenantSlug={tenantSlug}
						onPickTenant={(slug, dash) => goTenant(slug, dash)}
					/>
				)}

				<DropdownMenuSeparator className="my-1" />

				<DropdownMenuItem
					className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-[9px] text-[13px]"
					onClick={handleSignOutEverywhere}
				>
					<Icon name="logout" size={16} className="text-secondary-foreground" />
					Sign out of all devices
				</DropdownMenuItem>

				<DropdownMenuItem
					variant="destructive"
					className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-[9px] text-[13px]"
					onClick={handleSignOut}
				>
					<Icon name="logout" size={16} className="text-destructive" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
