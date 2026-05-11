import { Icon, type IconName } from "@/components/primitives/Icon";
import { cn } from "@/lib/utils";

type Feature = {
	icon: IconName;
	title: string;
	description: string;
	tint: string;
};

const FEATURES: Feature[] = [
	{
		icon: "users",
		title: "Member directory",
		description:
			"A single source of truth for households, contact details, and giving history — searchable in milliseconds.",
		tint: "var(--primary)",
	},
	{
		icon: "trending",
		title: "Campaigns & pledges",
		description:
			"Launch building funds, missions, or seasonal drives. Track every pledge and watch progress in real time.",
		tint: "var(--tx-tithe)",
	},
	{
		icon: "cash",
		title: "Tithes & offerings",
		description:
			"Record giving by type — tithe, offering, mission, first fruit — with receipt-ready breakdowns for every member.",
		tint: "var(--success)",
	},
	{
		icon: "chart",
		title: "Reports that breathe",
		description:
			"Beautiful, exportable views of giving trends, campaign health, and member engagement. No spreadsheet gymnastics.",
		tint: "var(--info)",
	},
	{
		icon: "shield",
		title: "Roles & invitations",
		description:
			"Admins, treasurers, and members each see exactly what they should. Invite by email; access expires the moment you revoke it.",
		tint: "var(--tertiary)",
	},
	{
		icon: "globe",
		title: "Multi-church ready",
		description:
			"Pastor more than one congregation? Switch between churches from a single account — every tenant kept perfectly separate.",
		tint: "var(--chart-5)",
	},
];

export const LandingFeatures = () => {
	return (
		<section
			id="features"
			className="relative scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24 lg:px-10"
		>
			<div className="mx-auto max-w-6xl">
				<div className="mx-auto max-w-2xl text-center">
					<div className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-accent-foreground">
						<Icon name="sparkles" size={12} />
						Features
					</div>
					<h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Everything a small church needs.
						<br />
						<span className="text-muted-foreground">
							Nothing it doesn&apos;t.
						</span>
					</h2>
					<p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
						ChurchFlow strips finance software down to the essentials — then
						polishes the experience until it feels effortless.
					</p>
				</div>

				<div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{FEATURES.map((feature, i) => (
						<FeatureCard key={feature.title} {...feature} index={i} />
					))}
				</div>
			</div>
		</section>
	);
};

const FeatureCard = ({
	icon,
	title,
	description,
	tint,
	index,
}: Feature & { index: number }) => {
	return (
		<div
			style={
				{
					"--feature-tint": tint,
					animationDelay: `${index * 70}ms`,
				} as React.CSSProperties
			}
			className={cn(
				"group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-border/60 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
				"animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700",
			)}
		>
			<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[var(--feature-tint)] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
			<div className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-[var(--feature-tint)] opacity-[0.06] blur-2xl transition-opacity duration-500 group-hover:opacity-[0.14]" />

			<div
				className="mb-4 grid size-11 place-items-center rounded-xl ring-1 ring-inset"
				style={{
					backgroundColor:
						"color-mix(in oklab, var(--feature-tint) 12%, transparent)",
					color: "var(--feature-tint)",
					boxShadow:
						"inset 0 0 0 1px color-mix(in oklab, var(--feature-tint) 22%, transparent)",
				}}
			>
				<Icon name={icon} size={22} />
			</div>

			<h3 className="text-base font-semibold tracking-tight text-foreground">
				{title}
			</h3>
			<p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
				{description}
			</p>
		</div>
	);
};
