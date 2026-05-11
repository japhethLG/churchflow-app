import type { ReactNode } from "react";

/**
 * Generic layout for legal/long-form content (Privacy, Terms, …).
 * Centres a comfortably-readable column with prose styling. Kept in the
 * landing folder so it lives next to the navbar/footer it pairs with.
 */
export const LegalArticle = ({
	eyebrow,
	title,
	lastUpdated,
	children,
}: {
	eyebrow: string;
	title: string;
	lastUpdated: string;
	children: ReactNode;
}) => {
	return (
		<article className="relative px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
			<div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-linear-to-b from-accent/30 via-background to-background" />
			<div className="mx-auto max-w-3xl">
				<header className="mb-12 border-b border-border/40 pb-8 animate-in fade-in slide-in-from-top-2 duration-500">
					<div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
						{eyebrow}
					</div>
					<h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
						{title}
					</h1>
					<p className="mt-3 text-sm text-muted-foreground">
						Last updated {lastUpdated}
					</p>
				</header>
				<div className="legal-prose flex flex-col gap-6 text-[15px] leading-relaxed text-secondary-foreground animate-in fade-in duration-700 delay-100 fill-mode-both">
					{children}
				</div>
			</div>
		</article>
	);
};

export const LegalSection = ({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) => (
	<section className="flex flex-col gap-3">
		<h2 className="text-xl font-semibold tracking-tight text-foreground">
			{title}
		</h2>
		<div className="flex flex-col gap-3">{children}</div>
	</section>
);
