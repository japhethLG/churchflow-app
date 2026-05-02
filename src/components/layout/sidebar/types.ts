import type { IconName } from "@/components/primitives/Icon";

export type NavItem = { icon: IconName; label: string; href: string };

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
