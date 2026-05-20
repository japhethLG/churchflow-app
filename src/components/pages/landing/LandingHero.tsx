"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";

/**
 * Hero band. CTA target depends on auth state:
 *   - signed-in users go to /launch (which knows the right dashboard)
 *   - guests go to /login
 */
export const LandingHero = ({
	isAuthenticated,
}: {
	isAuthenticated: boolean;
}) => {
	const router = useRouter();
	const primaryHref = isAuthenticated ? "/launch" : "/login";
	const primaryLabel = isAuthenticated ? "Open your dashboard" : "Get started";

	return (
		<section className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
			{/* Soft layered glows — purely decorative */}
			<div className="pointer-events-none absolute inset-0 -z-10">
				<div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/15 blur-[140px]" />
				<div className="absolute right-[-10%] top-32 h-[360px] w-[360px] rounded-full bg-tertiary/15 blur-[120px]" />
				<div className="absolute left-[-10%] top-72 h-[300px] w-[300px] rounded-full bg-accent/40 blur-[120px]" />
			</div>

			<div className="mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6 lg:px-10">
				<div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-medium text-secondary-foreground shadow-sm backdrop-blur animate-in fade-in slide-in-from-top-2 duration-700 fill-mode-both">
					<span className="relative flex size-1.5">
						<span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 opacity-75" />
						<span className="relative inline-flex size-1.5 rounded-full bg-primary" />
					</span>
					Built for churches with heart
				</div>

				<h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
					Care for your <br className="hidden sm:block" />
					<span className="bg-linear-to-r from-primary via-ring to-tertiary bg-clip-text text-transparent">
						congregation
					</span>{" "}
					with clarity.
				</h1>

				<p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 fill-mode-both">
					ChurchFlow is a calm, modern home for tithes, pledges, members, and
					stewardship reports — so leaders can spend less time wrangling
					spreadsheets and more time shepherding people.
				</p>

				<div className="mt-9 flex flex-col items-center gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
					<Button
						role="primary"
						size="lg"
						iconRight="arrowRight"
						onClick={() => router.push(primaryHref)}
					>
						{primaryLabel}
					</Button>
					<Button
						recipe="outline"
						role="secondary"
						size="lg"
						onClick={() => {
							const el = document.querySelector("#features");
							el?.scrollIntoView({ behavior: "smooth" });
						}}
					>
						See what&apos;s inside
					</Button>
				</div>

				<div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-muted-foreground/80 animate-in fade-in duration-700 delay-500 fill-mode-both">
					<span className="inline-flex items-center gap-1.5">
						<Icon name="shield" size={14} className="text-success" />
						Bank-grade auth via Google
					</span>
					<span className="inline-flex items-center gap-1.5">
						<Icon name="lock" size={14} className="text-info" />
						Tenant-isolated data
					</span>
					<span className="inline-flex items-center gap-1.5">
						<Icon name="heart" size={14} className="text-tertiary" />
						No card required
					</span>
				</div>
			</div>
		</section>
	);
};
