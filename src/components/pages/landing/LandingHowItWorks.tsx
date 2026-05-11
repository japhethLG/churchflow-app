import { Icon, type IconName } from "@/components/primitives/Icon";

type Step = {
	number: string;
	title: string;
	description: string;
	icon: IconName;
};

const STEPS: Step[] = [
	{
		number: "01",
		title: "Invite your team",
		description:
			"Add admins and treasurers in seconds. Invitations are email-based with revocable, role-scoped access.",
		icon: "mail",
	},
	{
		number: "02",
		title: "Add members & campaigns",
		description:
			"Import your directory, set up any active funds, and open pledges. The app handles tenants, slugs, and isolation for you.",
		icon: "users",
	},
	{
		number: "03",
		title: "Record giving, watch insights bloom",
		description:
			"Log tithes and offerings as they come in. Dashboards stay live; reports export when you need them on paper.",
		icon: "chart",
	},
];

export const LandingHowItWorks = () => {
	return (
		<section
			id="how-it-works"
			className="relative scroll-mt-20 bg-card/60 px-4 py-20 sm:px-6 sm:py-24 lg:px-10"
		>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent"
			/>
			<div className="mx-auto max-w-6xl">
				<div className="mx-auto max-w-2xl text-center">
					<div className="inline-flex items-center gap-2 rounded-full bg-tertiary-container px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-tertiary">
						How it works
					</div>
					<h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Up and running in an afternoon.
					</h2>
					<p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
						You don&apos;t need a migration plan or a vendor call. Just three
						calm steps from a fresh login to first deposit.
					</p>
				</div>

				<ol className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
					{STEPS.map((step, i) => (
						<li
							key={step.number}
							className="group relative flex flex-col rounded-2xl border border-border/40 bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-card animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both"
							style={{ animationDelay: `${i * 90}ms` }}
						>
							<div className="flex items-center justify-between">
								<span className="text-xs font-bold tracking-[0.25em] text-muted-foreground">
									{step.number}
								</span>
								<div className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground transition-transform duration-300 group-hover:scale-110">
									<Icon name={step.icon} size={16} />
								</div>
							</div>
							<h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
								{step.title}
							</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{step.description}
							</p>
						</li>
					))}
				</ol>
			</div>
		</section>
	);
};
