"use client";

import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { AuthMarketingShell } from "@/components/pages/auth";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import {
	useAcceptInvitation,
	useLookupInvitation,
} from "@/lib/api/invitations";
import { useAuth } from "@/lib/auth/AuthProvider";
import { refreshSession, signInWithGoogle, signOut } from "@/lib/auth/actions";
import dayjs from "@/lib/dayjs";
import { tenantInitials, tenantLogoGradient } from "@/lib/design/logo-gradient";

const daysRemaining = (expiresAt: string): number => {
	return Math.ceil(dayjs(expiresAt).diff(dayjs(), "day", true));
};

type Params = Promise<{ token: string }>;

export const InviteTokenPage = ({ params }: { params: Params }) => {
	const { token } = use(params);
	const router = useRouter();
	const { user: firebaseUser, loading: authLoading } = useAuth();
	const { data: invitation, isLoading, error } = useLookupInvitation(token);
	const { mutateAsync: acceptInvitation, isPending: accepting } =
		useAcceptInvitation();
	const [dismissed, setDismissed] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

	const handleAccept = async () => {
		setActionError(null);
		try {
			if (!firebaseUser) {
				await signInWithGoogle();
			}
			await acceptInvitation({ params: {}, body: { token } });
			await refreshSession();
			const role = invitation?.role;
			const slug = (invitation as { tenantSlug?: string })?.tenantSlug;
			const isClaim = Boolean(
				(invitation as { memberId?: string | null })?.memberId,
			);
			if (slug) {
				if (isClaim && role !== "ADMIN") {
					router.push(`/${slug}/welcome`);
				} else {
					router.push(
						role === "ADMIN"
							? `/${slug}/admin/dashboard`
							: `/${slug}/member/dashboard`,
					);
				}
			} else {
				router.push("/");
			}
		} catch (err) {
			setActionError(
				err instanceof Error
					? err.message
					: "Something went wrong. Please try again.",
			);
		}
	};

	const handleSwitchAccount = async () => {
		await signOut();
		window.location.reload();
	};

	const loading = isLoading || authLoading;
	const inv = invitation as
		| (typeof invitation & {
				tenantSlug?: string;
				tenantName?: string;
				inviterDisplayName?: string | null;
		  })
		| undefined;

	if (loading) {
		return (
			<AuthMarketingShell>
				<div className="mb-4 h-[18px] w-20 rounded-md bg-secondary" />
				<div className="mb-2 h-8 w-[90%] rounded-lg bg-secondary" />
				<div className="mb-6 h-8 w-[70%] rounded-lg bg-secondary" />
				<div className="h-[72px] rounded-xl bg-secondary" />
			</AuthMarketingShell>
		);
	}

	if (error || !inv) {
		return (
			<AuthMarketingShell>
				<div className="mb-3 text-xs font-semibold uppercase tracking-wider text-destructive">
					Invalid invitation
				</div>
				<h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
					This link is no longer valid.
				</h1>
				<p className="text-sm leading-relaxed text-secondary-foreground">
					This invitation link has expired, been cancelled, or was already
					accepted. Ask an admin to send you a new invitation.
				</p>
				<div className="mt-7">
					<Button
						role="secondary"
						size="lg"
						fullWidth
						onClick={() => router.push("/login")}
					>
						Go to login
					</Button>
				</div>
			</AuthMarketingShell>
		);
	}

	if (inv.status === "ACCEPTED") {
		const slug = inv.tenantSlug;
		return (
			<AuthMarketingShell>
				<div className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
					Already accepted
				</div>
				<h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground">
					You&apos;ve already joined{inv.tenantName ? ` ${inv.tenantName}` : ""}
					.
				</h1>
				<p className="text-sm leading-relaxed text-secondary-foreground">
					This invitation has already been accepted.
				</p>
				{slug && (
					<div className="mt-7">
						<Button
							role="primary"
							size="lg"
							fullWidth
							onClick={() =>
								router.push(
									inv.role === "ADMIN"
										? `/${slug}/admin/dashboard`
										: `/${slug}/member/dashboard`,
								)
							}
						>
							Go to church
						</Button>
					</div>
				)}
				<div className="mt-4 text-center">
					<Button
						role="secondary"
						recipe="ghost"
						size="sm"
						onClick={() => router.push("/login")}
					>
						Go to login
					</Button>
				</div>
			</AuthMarketingShell>
		);
	}

	if (dismissed) {
		return (
			<AuthMarketingShell>
				<p className="pt-4 text-center text-sm leading-relaxed text-secondary-foreground">
					No problem — simply close this tab.
				</p>
				<div className="mt-5 text-center">
					<Button
						role="secondary"
						recipe="ghost"
						size="sm"
						onClick={() => setDismissed(false)}
					>
						← Go back
					</Button>
				</div>
			</AuthMarketingShell>
		);
	}

	const { from, to } = tenantLogoGradient(inv.tenantSlug ?? inv.tenantId);
	const days = daysRemaining(inv.expiresAt);
	const busy = accepting;

	return (
		<AuthMarketingShell>
			<div className="mb-3 text-xs font-semibold uppercase tracking-wider text-tertiary">
				Invitation
			</div>
			<h1 className="m-0 text-3xl font-semibold leading-tight tracking-tight text-foreground">
				You&apos;ve been invited to{" "}
				<span className="bg-[linear-gradient(135deg,var(--ring),var(--primary))] bg-clip-text text-transparent">
					{inv.tenantName ?? "a church"}
				</span>
				.
			</h1>
			<p className="mt-3.5 text-sm leading-relaxed text-secondary-foreground">
				{inv.inviterDisplayName ?? "An admin"} invited you to join as a{" "}
				<strong className="text-foreground">
					{inv.role === "ADMIN" ? "Admin" : "Member"}
				</strong>
				. Sign in with Google to accept.
			</p>

			<div className="mt-7 flex gap-4 rounded-xl bg-muted p-4">
				<div className="flex min-w-0 flex-1 items-center gap-2.5">
					{/* Tenant-specific palette — hex pair from tenantLogoGradient; Tailwind can't express runtime stops */}
					<div
						className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-semibold text-white"
						style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
					>
						{tenantInitials(inv.tenantName ?? "")}
					</div>
					<div className="min-w-0">
						<div className="text-sm font-semibold">{inv.tenantName ?? "—"}</div>
						<div className="text-xs text-muted-foreground">{inv.email}</div>
					</div>
				</div>
				{inv.inviterDisplayName && (
					<>
						<div className="w-px shrink-0 bg-secondary" />
						<div className="flex min-w-0 flex-1 items-center gap-2.5">
							<Avatar name={inv.inviterDisplayName} size={36} />
							<div className="min-w-0">
								<div className="text-sm font-semibold">
									{inv.inviterDisplayName}
								</div>
								<div className="text-xs text-muted-foreground">Admin</div>
							</div>
						</div>
					</>
				)}
			</div>

			{firebaseUser && (
				<div className="mt-4 flex items-center gap-2.5 rounded-[10px] bg-muted px-3.5 py-2.5 text-sm">
					<Avatar
						name={firebaseUser.displayName ?? firebaseUser.email ?? "?"}
						src={firebaseUser.photoURL ?? undefined}
						size={28}
					/>
					<span className="min-w-0 flex-1 text-secondary-foreground">
						Accepting as{" "}
						<strong className="text-foreground">
							{firebaseUser.displayName ?? firebaseUser.email}
						</strong>
					</span>
					<Button
						type="button"
						role="secondary"
						recipe="outline"
						size="sm"
						className="h-auto shrink-0 border-none bg-transparent p-0 text-xs font-normal text-primary shadow-none hover:bg-transparent hover:text-primary hover:underline"
						onClick={handleSwitchAccount}
					>
						Switch
					</Button>
				</div>
			)}

			{actionError && (
				<p className="mt-3 text-sm text-destructive">{actionError}</p>
			)}

			<div className="mt-5">
				<Button
					role="primary"
					size="lg"
					fullWidth
					icon={firebaseUser ? undefined : "google"}
					disabled={busy}
					onClick={handleAccept}
				>
					{firebaseUser ? "Accept invitation" : "Accept & Continue with Google"}
				</Button>
			</div>

			<Button
				type="button"
				role="secondary"
				recipe="ghost"
				size="sm"
				className="mt-4 h-auto w-full text-sm font-normal text-muted-foreground hover:text-foreground"
				onClick={() => setDismissed(true)}
			>
				This wasn&apos;t meant for me
			</Button>
			<div className="mt-3 text-center text-xs text-muted-foreground">
				{days > 0
					? `Invitation expires in ${days} day${days === 1 ? "" : "s"}.`
					: "Invitation expires today."}
			</div>
		</AuthMarketingShell>
	);
};
