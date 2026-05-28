"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { profileHrefFor } from "@/components/layout/sidebar/account-menu/routes";
import type {
	Perspective,
	TenantSummary,
} from "@/components/layout/sidebar/types";
import { Avatar } from "@/components/primitives/Avatar";
import { Badge } from "@/components/primitives/Badge";
import { Card } from "@/components/primitives/Card";
import { Icon, type IconName } from "@/components/primitives/Icon";
import { Pressable } from "@/components/primitives/Pressable";
import { BaseSheet } from "@/components/sheets/BaseSheet";
import { type Theme, useTheme } from "@/components/theme-provider";
import { signOut, signOutEverywhere } from "@/lib/auth/actions";
import { openModal } from "@/lib/modals/store";
import type { SheetBaseProps } from "@/lib/sheets/registry";
import { useSheetDrill } from "@/lib/sheets/useSheetDrill";
import { cn } from "@/lib/utils";

export type AccountSheetProps = {
	perspective: Perspective;
	tenantSlug?: string;
	userName: string;
	userEmail?: string;
	memberships: TenantSummary[];
	isSuperAdmin: boolean;
};

declare module "@/lib/sheets/registry" {
	interface SheetPropsMap {
		account: AccountSheetProps;
	}
}

const SectionLabel = ({ children }: { children: string }) => (
	<div className="mb-1.5 mt-3.5 px-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground first:mt-1">
		{children}
	</div>
);

const Row = ({
	icon,
	iconClass,
	title,
	subtitle,
	trailing,
	danger,
	active,
	onClick,
}: {
	icon: IconName;
	iconClass?: string;
	title: string;
	subtitle?: string;
	trailing?: ReactNode;
	danger?: boolean;
	active?: boolean;
	onClick: () => void;
}) => (
	<Pressable
		onClick={onClick}
		className="flex w-full items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-muted"
	>
		<span
			className={cn(
				"grid size-8 shrink-0 place-items-center rounded-lg",
				iconClass ?? "bg-muted text-muted-foreground",
			)}
		>
			<Icon name={icon} size={17} />
		</span>
		<span className="min-w-0 flex-1">
			<span
				className={cn(
					"block truncate text-sm font-semibold",
					danger
						? "text-destructive"
						: active
							? "text-primary"
							: "text-foreground",
				)}
			>
				{title}
			</span>
			{subtitle && (
				<span className="block truncate text-xs text-muted-foreground">
					{subtitle}
				</span>
			)}
		</span>
		<span className="flex shrink-0 items-center gap-1.5">
			{active && <Icon name="check" size={16} className="text-primary" />}
			{trailing ?? (
				<Icon
					name="chevronRight"
					size={16}
					className={danger ? "text-destructive" : "text-muted-foreground"}
				/>
			)}
		</span>
	</Pressable>
);

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Monitor },
];

const ThemeSegmented = () => {
	const { theme, setTheme } = useTheme();
	return (
		<div className="flex gap-1 rounded-xl bg-muted p-1">
			{THEME_OPTIONS.map(({ value, label, icon: ThemeIcon }) => {
				const active = theme === value;
				return (
					<Pressable
						key={value}
						onClick={() => setTheme(value)}
						className={cn(
							"flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-xs font-semibold transition-all",
							active
								? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<ThemeIcon size={16} className="shrink-0" />
						{label}
					</Pressable>
				);
			})}
		</div>
	);
};

type View = "main" | "admin" | "member";

/**
 * Mobile account sheet — the bottom-sheet analogue of the desktop
 * `AccountMenu`. Same sections in the same order (Identity → Profile →
 * Switch context → Appearance → Sign out); the per-role tenant lists that
 * are submenus on desktop become an in-sheet drill-down here via
 * `useSheetDrill`.
 */
export const AccountSheet = ({
	open,
	onOpenChange,
	onOpenChangeComplete,
	perspective,
	tenantSlug,
	userName,
	userEmail,
	memberships,
	isSuperAdmin,
}: SheetBaseProps & AccountSheetProps) => {
	const router = useRouter();
	const drill = useSheetDrill<View>("main", open);

	const adminTenants = memberships.filter((m) => m.role === "ADMIN");
	const memberTenants = memberships;

	const close = () => onOpenChange(false);
	const go = (href: string) => {
		close();
		router.push(href);
	};

	const handleSignOut = async () => {
		close();
		await signOut();
		router.push("/login");
	};

	const handleSignOutEverywhere = () => {
		close();
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

	const pickerTenants = drill.view === "admin" ? adminTenants : memberTenants;
	const pickerDash = drill.view === "admin" ? "admin" : "member";
	const pickerActive = perspective === drill.view;

	return (
		<BaseSheet
			open={open}
			onOpenChange={onOpenChange}
			onOpenChangeComplete={onOpenChangeComplete}
			title={drill.isDrilled ? "Select church" : "Account"}
			description={
				drill.isDrilled
					? `Switch to a church you ${drill.view === "admin" ? "administer" : "belong to"}.`
					: undefined
			}
			onBack={drill.isDrilled ? () => drill.drillBack() : undefined}
			contentClassName="overflow-x-hidden"
		>
			<div key={drill.view} className={drill.transitionClass}>
				{drill.isDrilled ? (
					<Card padding={8} className="mt-2">
						{pickerTenants.map((m, i) => {
							const current = pickerActive && tenantSlug === m.slug;
							return (
								<div key={m.slug}>
									<Row
										icon={drill.view === "admin" ? "shield" : "user"}
										iconClass="bg-primary/10 text-primary"
										title={m.name}
										subtitle={drill.view === "admin" ? "Admin" : "Member"}
										active={current}
										trailing={current ? <span /> : undefined}
										onClick={() => go(`/${m.slug}/${pickerDash}/dashboard`)}
									/>
									{i < pickerTenants.length - 1 && (
										<div className="mx-3 h-px bg-border" />
									)}
								</div>
							);
						})}
					</Card>
				) : (
					<>
						{/* Identity */}
						<Card padding={12} className="mt-2">
							<div className="flex items-center gap-3">
								<Avatar name={userName} size={40} />
								<div className="min-w-0 flex-1">
									<div className="truncate text-[15px] font-bold tracking-tight">
										{userName}
									</div>
									{userEmail && (
										<div className="truncate text-xs text-muted-foreground">
											{userEmail}
										</div>
									)}
								</div>
								<Badge color="indigo" className="shrink-0 capitalize">
									{perspective === "super" ? "Platform" : perspective}
								</Badge>
							</div>
						</Card>

						<Card padding={8} className="mt-2">
							<Row
								icon="user"
								iconClass="bg-primary/10 text-primary"
								title="Profile"
								onClick={() => go(profileHrefFor(perspective, tenantSlug))}
							/>
						</Card>

						<SectionLabel>Switch context</SectionLabel>
						<Card padding={8}>
							{isSuperAdmin && (
								<>
									<Row
										icon="chart"
										iconClass="bg-tertiary/15 text-tertiary"
										title="Platform"
										subtitle="Super-admin tools"
										active={perspective === "super"}
										trailing={perspective === "super" ? <span /> : undefined}
										onClick={() => go("/super-admin/tenants")}
									/>
									{(adminTenants.length > 0 || memberTenants.length > 0) && (
										<div className="mx-3 h-px bg-border" />
									)}
								</>
							)}
							{adminTenants.length > 0 && (
								<Row
									icon="settings"
									title="Admin"
									subtitle={`${adminTenants.length} ${adminTenants.length === 1 ? "church" : "churches"}`}
									active={perspective === "admin"}
									onClick={() => drill.drillTo("admin")}
								/>
							)}
							{adminTenants.length > 0 && memberTenants.length > 0 && (
								<div className="mx-3 h-px bg-border" />
							)}
							{memberTenants.length > 0 && (
								<Row
									icon="user"
									title="Member"
									subtitle={`${memberTenants.length} ${memberTenants.length === 1 ? "church" : "churches"}`}
									active={perspective === "member"}
									onClick={() => drill.drillTo("member")}
								/>
							)}
						</Card>

						<SectionLabel>Appearance</SectionLabel>
						<ThemeSegmented />

						<SectionLabel>Sign out</SectionLabel>
						<Card padding={8}>
							<Row
								icon="shield"
								title="Sign out of all devices"
								subtitle="Revoke every active session"
								onClick={handleSignOutEverywhere}
							/>
							<div className="mx-3 h-px bg-border" />
							<Row
								icon="logout"
								iconClass="bg-destructive/10 text-destructive"
								title="Sign out"
								subtitle="Only this device"
								danger
								onClick={handleSignOut}
							/>
						</Card>
					</>
				)}
			</div>
		</BaseSheet>
	);
};
