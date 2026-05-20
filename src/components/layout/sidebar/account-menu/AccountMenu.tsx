"use client";

import * as Lucide from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactElement, useState } from "react";

import { Icon } from "@/components/primitives/Icon";
import { Pressable } from "@/components/primitives/Pressable";
import { useTheme } from "@/components/theme-provider";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { signOut, signOutEverywhere } from "@/lib/auth/actions";
import { openModal } from "@/lib/modals/store";
import { cn } from "@/lib/utils";
import type { Perspective, TenantSummary } from "../types";
import { AccountIdentityHeader } from "./AccountIdentityHeader";
import { AccountMenuSectionLabel } from "./AccountMenuSectionLabel";
import { AccountMenuTrigger } from "./AccountMenuTrigger";
import { PlatformMenuItem } from "./PlatformMenuItem";
import { profileHrefFor } from "./routes";
import { TenantRoleSubmenu } from "./TenantRoleSubmenu";

/**
 * Render-prop signature for swapping the AccountMenu trigger. The element
 * must forward `menuOpen` so it can mirror the dropdown state visually
 * (chevron rotation, hover background, …). Base UI injects the actual
 * trigger handlers/aria/tabindex via `render`, so the consumer only owns
 * the *appearance*.
 */
export type AccountMenuTriggerRender = (args: {
	menuOpen: boolean;
	userName: string;
	userEmail?: string;
	perspective: Perspective;
}) => ReactElement;

export const AccountMenu = ({
	perspective,
	tenantSlug,
	userName,
	userEmail,
	memberships,
	isSuperAdmin,
	side = "top",
	align = "start",
	renderTrigger,
}: {
	perspective: Perspective;
	tenantSlug?: string;
	userName: string;
	userEmail?: string;
	memberships: TenantSummary[];
	isSuperAdmin: boolean;
	/** Popup placement — sidebar opens "top", navbar wants "bottom". */
	side?: "top" | "bottom";
	align?: "start" | "center" | "end";
	/** Custom trigger renderer; defaults to the sidebar-styled trigger. */
	renderTrigger?: AccountMenuTriggerRender;
}) => {
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);
	const { theme, setTheme } = useTheme();

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

	const triggerEl = renderTrigger ? (
		renderTrigger({ menuOpen, userName, userEmail, perspective })
	) : (
		<AccountMenuTrigger
			userName={userName}
			perspective={perspective}
			menuOpen={menuOpen}
		/>
	);

	// Popup shadow flips direction with placement so the elevation reads
	// correctly regardless of whether it opens upward (sidebar) or
	// downward (top navbar). Sidebar trigger is wide → popup matches its
	// width via --anchor-width; navbar trigger is a small avatar so we
	// just clamp to a comfortable min width.
	const popupShadow =
		side === "top"
			? "shadow-[0_-4px_6px_rgba(0,0,0,0.03),0_-12px_28px_rgba(0,0,0,0.08)]"
			: "shadow-[0_4px_6px_rgba(0,0,0,0.03),0_12px_28px_rgba(0,0,0,0.08)]";
	const popupSize =
		side === "top" ? "w-[var(--anchor-width)] min-w-[200px]" : "min-w-[240px]";

	return (
		<DropdownMenu onOpenChange={setMenuOpen}>
			<DropdownMenuTrigger render={triggerEl} />
			<DropdownMenuContent
				side={side}
				align={align}
				sideOffset={6}
				className={`z-50 ${popupSize} rounded-[14px] border-0 bg-card p-1.5 ${popupShadow}`}
			>
				<AccountIdentityHeader userName={userName} userEmail={userEmail} />

				<DropdownMenuItem
					className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-[9px] text-sm font-medium text-primary [&_svg]:text-primary"
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

				<AccountMenuSectionLabel>Appearance</AccountMenuSectionLabel>
				<div className="px-2 py-1">
					<div className="flex items-center gap-1 rounded-[10px] bg-muted p-1">
						<Pressable
							onClick={() => setTheme("light")}
							className={cn(
								"flex flex-1 items-center justify-center gap-0.5 rounded-[6px] py-1.5 text-xs font-semibold transition-all cursor-pointer",
								theme === "light"
									? "bg-card text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground hover:bg-card/40",
							)}
						>
							<Lucide.Sun size={13} className="shrink-0" />
							Light
						</Pressable>
						<Pressable
							onClick={() => setTheme("dark")}
							className={cn(
								"flex flex-1 items-center justify-center gap-0.5 rounded-[6px] py-1.5 text-xs font-semibold transition-all cursor-pointer",
								theme === "dark"
									? "bg-card text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground hover:bg-card/40",
							)}
						>
							<Lucide.Moon size={13} className="shrink-0" />
							Dark
						</Pressable>
						<Pressable
							onClick={() => setTheme("system")}
							className={cn(
								"flex flex-1 items-center justify-center gap-0.5 rounded-[6px] py-1.5 text-xs font-semibold transition-all cursor-pointer",
								theme === "system"
									? "bg-card text-foreground shadow-sm"
									: "text-muted-foreground hover:text-foreground hover:bg-card/40",
							)}
						>
							<Lucide.Monitor size={13} className="shrink-0" />
							System
						</Pressable>
					</div>
				</div>

				<DropdownMenuSeparator className="my-1" />

				<DropdownMenuItem
					className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-[9px] text-sm"
					onClick={handleSignOutEverywhere}
				>
					<Icon name="logout" size={16} className="text-secondary-foreground" />
					Sign out of all devices
				</DropdownMenuItem>

				<DropdownMenuItem
					variant="destructive"
					className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-[9px] text-sm"
					onClick={handleSignOut}
				>
					<Icon name="logout" size={16} className="text-destructive" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
