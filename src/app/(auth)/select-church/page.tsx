import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthMarketingShell } from "@/components/pages/auth";
import { Badge } from "@/components/primitives/Badge";
import { getSessionUser } from "@/lib/auth/server";

export default async () => {
	const user = await getSessionUser();
	if (!user) redirect("/login");

	const memberships = Object.entries(user.tenantMemberships).map(
		([slug, m]) => ({
			slug,
			role: m.role,
		}),
	);

	if (memberships.length === 1 && !user.isSuperAdmin) {
		const [{ slug, role }] = memberships;
		redirect(
			role === "ADMIN"
				? `/${slug}/admin/dashboard`
				: `/${slug}/member/dashboard`,
		);
	}

	return (
		<AuthMarketingShell panel="plain-wide">
			<h1 className="m-0 text-center text-[32px] font-semibold tracking-tight text-foreground">
				{memberships.length === 0 ? "No churches yet" : "Which church today?"}
			</h1>
			<p className="mt-2.5 text-center text-[15px] text-secondary-foreground">
				{memberships.length === 0
					? "You're signed in, but haven't been added to a church yet. Ask your pastor to send you an invitation."
					: "Pick the church you want to act in."}
			</p>

			{memberships.length > 0 && (
				<div
					className={
						memberships.length > 1
							? "mt-8 grid grid-cols-2 gap-4"
							: "mt-8 grid grid-cols-1 gap-4"
					}
				>
					{memberships.map(({ slug, role }) => (
						<Link
							key={slug}
							href={
								role === "ADMIN"
									? `/${slug}/admin/dashboard`
									: `/${slug}/member/dashboard`
							}
							className="flex items-center gap-4 rounded-2xl bg-card p-6 text-foreground no-underline shadow-sm transition-colors hover:bg-muted/40"
						>
							<div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[linear-gradient(135deg,var(--ring),var(--primary))] font-semibold text-white">
								{slug.slice(0, 2).toUpperCase()}
							</div>
							<div className="min-w-0 flex-1">
								<div className="text-base font-semibold tracking-tight">
									{slug}
								</div>
								<div className="mt-1 text-xs text-muted-foreground">
									/{slug}
								</div>
							</div>
							<Badge color={role === "ADMIN" ? "indigo" : "gray"}>
								{role === "ADMIN" ? "Admin" : "Member"}
							</Badge>
						</Link>
					))}
				</div>
			)}

			{user.isSuperAdmin && (
				<div className="mt-8 rounded-xl bg-muted p-5 text-center">
					<div className="mb-2 text-[13px] text-muted-foreground">
						You&apos;re a platform admin.
					</div>
					<Link
						href="/super-admin/tenants"
						className="font-semibold text-primary no-underline hover:underline"
					>
						Go to platform ops →
					</Link>
				</div>
			)}

			<div className="mt-6 text-center text-xs text-muted-foreground">
				You can switch churches anytime from the sidebar.
			</div>
		</AuthMarketingShell>
	);
};
