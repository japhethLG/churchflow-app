import Link from "next/link";
import { Wordmark } from "@/components/primitives/Wordmark";

const LINKS = [
	{ href: "#features", label: "Features" },
	{ href: "#how-it-works", label: "How it works" },
	{ href: "#faq", label: "FAQ" },
	{ href: "/privacy", label: "Privacy" },
	{ href: "/terms", label: "Terms" },
] as const;

export const LandingFooter = () => {
	return (
		<footer className="border-t border-border/40 bg-card/50 px-4 py-12 sm:px-6 lg:px-10">
			<div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
				<div className="flex flex-col gap-2">
					<Wordmark size="md" />
					<p className="text-xs text-muted-foreground">
						© {new Date().getFullYear()} ChurchFlow. Built for churches with
						heart.
					</p>
				</div>

				<nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
					{LINKS.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className="no-underline transition-colors hover:text-primary"
						>
							{link.label}
						</Link>
					))}
				</nav>
			</div>
		</footer>
	);
};
