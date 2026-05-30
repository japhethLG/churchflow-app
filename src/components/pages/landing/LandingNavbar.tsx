"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	AccountMenu,
	type Perspective,
	type TenantSummary,
} from "@/components/layout/sidebar";
import { Button } from "@/components/primitives/Button";
import { Wordmark } from "@/components/primitives/Wordmark";
import { openSheet } from "@/lib/sheets/store";
import { cn } from "@/lib/utils";
import { NavbarAccountTrigger } from "./NavbarAccountTrigger";

/**
 * Tracks which section element is currently in the viewport so the
 * navbar can highlight the matching anchor link. We use a single
 * IntersectionObserver keyed by id, with a `rootMargin` that pulls the
 * activation band into the upper third of the viewport — that way the
 * highlight flips as a section *arrives*, not when it's already
 * scrolled past, which matches what users expect from a sticky navbar.
 */
const useActiveSection = (ids: readonly string[]): string | null => {
	const [activeId, setActiveId] = useState<string | null>(null);
	// Stable key so the effect doesn't re-run on every render even when
	// callers pass the array inline.
	const key = useMemo(() => ids.join("|"), [ids]);

	useEffect(() => {
		const idList = key.split("|").filter(Boolean);
		if (idList.length === 0 || typeof window === "undefined") {
			return;
		}

		const elements = idList
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null);
		if (elements.length === 0) {
			return;
		}

		// Visible map updated by the observer; the active id is the
		// first (top-most) intersecting section in document order.
		const visibility = new Map<string, boolean>();

		const recompute = () => {
			const next = idList.find((id) => visibility.get(id)) ?? null;
			setActiveId((prev) => (prev === next ? prev : next));
		};

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					visibility.set(entry.target.id, entry.isIntersecting);
				}
				recompute();
			},
			{
				// Pulls activation into the strip between 25%-65% of the
				// viewport — generous enough that short sections still
				// register, narrow enough that two sections rarely
				// overlap as "active".
				rootMargin: "-25% 0px -35% 0px",
				threshold: 0,
			},
		);

		for (const el of elements) {
			observer.observe(el);
		}

		return () => observer.disconnect();
	}, [key]);

	return activeId;
};

export type LandingNavbarUser = {
	userName: string;
	userEmail?: string;
	memberships: TenantSummary[];
	isSuperAdmin: boolean;
	/** Default perspective used by the AccountMenu (drives the profile link). */
	perspective: Perspective;
	tenantSlug?: string;
};

const NAV_ITEMS = [
	{ href: "#features", label: "Features" },
	{ href: "#how-it-works", label: "How it works" },
	{ href: "#faq", label: "FAQ" },
] as const;

const SECTION_IDS = NAV_ITEMS.map((item) => item.href.slice(1));

/**
 * Public landing navbar. The middle slot holds in-page anchor links; the
 * right slot conditionally renders "Sign in" or the AccountMenu dropdown
 * (reused from the sidebar but with a navbar-style trigger). On viewports
 * narrower than `md`, the anchor links collapse into a hamburger panel
 * and only the "primary CTA" (sign in or avatar) remains visible.
 *
 * `showNavItems` is false on routes where the in-page anchors don't
 * resolve (the legal pages live on different URLs) — in that mode the
 * navbar collapses to a simple branding + auth strip with no hamburger.
 */
export const LandingNavbar = ({
	user,
	showNavItems = true,
}: {
	user: LandingNavbarUser | null;
	showNavItems?: boolean;
}) => {
	const router = useRouter();
	const [scrolled, setScrolled] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const activeSection = useActiveSection(showNavItems ? SECTION_IDS : []);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		if (!mobileOpen) {
			return;
		}
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [mobileOpen]);

	const closeMobile = () => setMobileOpen(false);

	return (
		<header
			className={cn(
				"fixed inset-x-0 top-0 z-40 transition-all duration-300",
				scrolled
					? "border-b border-border/40 bg-background/80 backdrop-blur-md"
					: "border-b border-transparent bg-transparent",
			)}
		>
			{/*
			 * Three equal-flex columns so the centre nav items are
			 * centred against the navbar itself, not against whatever
			 * space is left after the logo and auth controls. When the
			 * nav items aren't shown (legal pages), the middle column
			 * stays empty and the layout still reads as a clean
			 * branding-left / actions-right strip.
			 */}
			<nav className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-10">
				<div className="flex flex-1 items-center justify-start">
					<Link href="/" className="flex items-center no-underline">
						<Wordmark size="md" />
					</Link>
				</div>

				{showNavItems && (
					<div className="hidden items-center gap-1 md:flex">
						{NAV_ITEMS.map((item) => {
							const id = item.href.slice(1);
							const isActive = activeSection === id;
							return (
								<Link
									key={item.href}
									href={item.href}
									aria-current={isActive ? "true" : undefined}
									className={cn(
										"relative rounded-full px-3 py-2 text-sm font-medium no-underline transition-all duration-300",
										isActive
											? "text-primary"
											: "text-secondary-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									{item.label}
									{/* Animated underline pill — sits below the
									    label and grows in from the centre when the
									    section becomes active. */}
									<span
										aria-hidden="true"
										className={cn(
											"pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-center rounded-full bg-linear-to-r from-primary via-ring to-primary transition-transform duration-300 ease-out",
											isActive ? "scale-x-100" : "scale-x-0",
										)}
									/>
								</Link>
							);
						})}
					</div>
				)}

				<div className="flex flex-1 items-center justify-end gap-2">
					{user ? (
						<>
							{/* Desktop → AccountMenu dropdown. */}
							<div className="hidden md:block">
								<AccountMenu
									perspective={user.perspective}
									tenantSlug={user.tenantSlug}
									userName={user.userName}
									userEmail={user.userEmail}
									memberships={user.memberships}
									isSuperAdmin={user.isSuperAdmin}
									side="bottom"
									align="end"
									renderTrigger={({ menuOpen, userName }) => (
										<NavbarAccountTrigger
											menuOpen={menuOpen}
											userName={userName}
										/>
									)}
								/>
							</div>
							{/* Mobile → AccountSheet bottom sheet. */}
							<NavbarAccountTrigger
								className="md:hidden"
								menuOpen={false}
								userName={user.userName}
								onClick={() =>
									openSheet("account", {
										perspective: user.perspective,
										tenantSlug: user.tenantSlug,
										userName: user.userName,
										userEmail: user.userEmail,
										memberships: user.memberships,
										isSuperAdmin: user.isSuperAdmin,
									})
								}
							/>
						</>
					) : (
						<>
							<Button
								role="secondary"
								size="sm"
								className="hidden sm:inline-flex"
								onClick={() => router.push("/login")}
							>
								Sign in
							</Button>
							<Button
								role="primary"
								size="sm"
								iconRight="arrowRight"
								onClick={() => router.push("/login")}
							>
								Get started
							</Button>
						</>
					)}

					{showNavItems && (
						<Button
							role="secondary"
							size="sm"
							className="px-2 md:hidden"
							aria-label="Toggle navigation"
							onClick={() => setMobileOpen((v) => !v)}
							icon={mobileOpen ? "close" : "menu"}
						/>
					)}
				</div>
			</nav>

			{showNavItems && mobileOpen && (
				<div className="fixed inset-x-0 top-16 z-30 border-b border-border/40 bg-background/95 backdrop-blur-md md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
					<div className="flex flex-col gap-1 px-4 py-4 sm:px-6">
						{NAV_ITEMS.map((item) => {
							const id = item.href.slice(1);
							const isActive = activeSection === id;
							return (
								<Link
									key={item.href}
									href={item.href}
									onClick={closeMobile}
									aria-current={isActive ? "true" : undefined}
									className={cn(
										"relative rounded-xl px-4 py-3 text-base font-medium no-underline transition-colors duration-300",
										isActive
											? "bg-accent text-primary"
											: "text-secondary-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									{/* Left-edge accent bar that slides in when the
									    section is active — mirrors the underline
									    pill on desktop. */}
									<span
										aria-hidden="true"
										className={cn(
											"absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary transition-all duration-300",
											isActive
												? "translate-x-0 opacity-100"
												: "-translate-x-1 opacity-0",
										)}
									/>
									{item.label}
								</Link>
							);
						})}
						{!user && (
							<div className="mt-2 flex items-center gap-2 border-t border-border/50 pt-3 sm:hidden">
								<Button
									role="secondary"
									recipe="outline"
									size="md"
									fullWidth
									onClick={() => {
										closeMobile();
										router.push("/login");
									}}
								>
									Sign in
								</Button>
							</div>
						)}
					</div>
				</div>
			)}

			{showNavItems && mobileOpen && (
				<div
					aria-hidden="true"
					onClick={closeMobile}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							closeMobile();
						}
					}}
					className="fixed inset-0 top-16 z-20 cursor-default bg-foreground/10 md:hidden"
				/>
			)}
		</header>
	);
};
