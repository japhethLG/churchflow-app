"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	FieldReconciler,
	type ReconcileChoice,
} from "@/components/pages/welcome";
import { Avatar, Button, Card, Wordmark } from "@/components/primitives";
import { useMyProfile, useUpdateMyProfile } from "@/lib/api/members";
import { useAuth } from "@/lib/auth/AuthProvider";
import { cn } from "@/lib/utils";

type FieldState = { choice: ReconcileChoice; edited: string };

const asString = (v: unknown): string | null => {
	return typeof v === "string" && v.length > 0 ? v : null;
};

const pick = (
	state: FieldState,
	existing: string | null,
	sso: string | null,
): string => {
	if (state.choice === "existing") return existing ?? "";
	if (state.choice === "sso") return sso ?? "";
	return state.edited;
};

const Shell = ({ children }: { children: React.ReactNode }) => (
	<div className="flex min-h-dvh justify-center bg-muted px-6 py-12">
		<div className="w-full max-w-[560px]">
			<div className="mb-8">
				<Wordmark />
			</div>
			{children}
		</div>
	</div>
);

export const WelcomePage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const { user: firebaseUser, loading: authLoading } = useAuth();
	const { data: member, isLoading } = useMyProfile(tenantSlug);
	const { mutateAsync, isPending } = useUpdateMyProfile(tenantSlug);

	const ssoName = useMemo(() => {
		const dn = firebaseUser?.displayName ?? "";
		const idx = dn.indexOf(" ");
		return {
			first: idx >= 0 ? dn.slice(0, idx) : dn,
			last: idx >= 0 ? dn.slice(idx + 1) : "",
		};
	}, [firebaseUser]);

	const [first, setFirst] = useState<FieldState>({
		choice: "existing",
		edited: "",
	});
	const [last, setLast] = useState<FieldState>({
		choice: "existing",
		edited: "",
	});
	const [phone, setPhone] = useState<FieldState>({
		choice: "existing",
		edited: "",
	});
	const [address, setAddress] = useState<FieldState>({
		choice: "existing",
		edited: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (saved || !member) return;
		const existingFirst = asString(member.firstName);
		const existingLast = asString(member.lastName);
		const existingPhone = asString(member.phone);
		const existingAddress = asString(member.address);
		setFirst({
			choice: ssoName.first ? "sso" : "existing",
			edited: ssoName.first || existingFirst || "",
		});
		setLast({
			choice: ssoName.last ? "sso" : "existing",
			edited: ssoName.last || existingLast || "",
		});
		setPhone({ choice: "existing", edited: existingPhone ?? "" });
		setAddress({ choice: "existing", edited: existingAddress ?? "" });
	}, [member, ssoName, saved]);

	const loading = authLoading || isLoading || !member;

	if (loading) {
		return (
			<Shell>
				<div className="flex flex-col gap-3">
					{[80, "100%", "70%", "100%"].map((w, i) => (
						<div
							key={i}
							className={cn(
								"h-[18px] rounded-md bg-secondary",
								w === "100%" ? "w-full" : w === "70%" ? "w-[70%]" : "w-20",
							)}
						/>
					))}
				</div>
			</Shell>
		);
	}

	const existingFirst = asString(member.firstName);
	const existingLast = asString(member.lastName);
	const existingPhone = asString(member.phone);
	const existingAddress = asString(member.address);
	const ssoFirst = ssoName.first || null;
	const ssoLast = ssoName.last || null;

	const finalFirst = pick(first, existingFirst, ssoFirst).trim();
	const finalLast = pick(last, existingLast, ssoLast).trim();
	const finalPhone = pick(phone, existingPhone, null).trim();
	const finalAddress = pick(address, existingAddress, null).trim();

	const canSubmit = finalFirst.length > 0 && finalLast.length > 0;

	const handleContinue = async () => {
		setError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug } },
				body: {
					firstName: finalFirst,
					lastName: finalLast,
					...(phone.choice === "existing" && existingPhone === finalPhone
						? {}
						: { phone: finalPhone || undefined }),
					...(address.choice === "existing" && existingAddress === finalAddress
						? {}
						: { address: finalAddress || undefined }),
				},
			});
			setSaved(true);
			router.push(`/${tenantSlug}/member/dashboard`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not save profile");
		}
	};

	return (
		<Shell>
			<div className="mb-7">
				<div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
					Welcome
				</div>
				<h1 className="mb-2.5 mt-0 text-[28px] font-semibold leading-tight tracking-tight text-foreground">
					Let&apos;s confirm your profile.
				</h1>
				<p className="m-0 text-[15px] leading-normal text-secondary-foreground">
					Your church already has a profile for you. Pick which details to keep
					or replace with the ones from your Google account.
				</p>
			</div>

			<Card padding={24} className="mb-5">
				<div className="flex items-center gap-3.5">
					<Avatar
						name={firebaseUser?.displayName ?? firebaseUser?.email ?? "You"}
						src={firebaseUser?.photoURL ?? undefined}
						size={56}
					/>
					<div className="min-w-0 flex-1">
						<div className="text-[15px] font-semibold text-foreground">
							Signed in as {firebaseUser?.displayName ?? firebaseUser?.email}
						</div>
						<div className="text-[13px] text-muted-foreground">
							{firebaseUser?.email} — used as your contact email going forward
						</div>
					</div>
				</div>
			</Card>

			<Card padding={24} className="flex flex-col gap-5">
				<FieldReconciler
					label="First name"
					existing={existingFirst}
					sso={ssoFirst}
					choice={first.choice}
					edited={first.edited}
					onChange={setFirst}
				/>
				<FieldReconciler
					label="Last name"
					existing={existingLast}
					sso={ssoLast}
					choice={last.choice}
					edited={last.edited}
					onChange={setLast}
				/>
				<FieldReconciler
					label="Phone"
					existing={existingPhone}
					sso={null}
					choice={phone.choice}
					edited={phone.edited}
					onChange={setPhone}
					hint="Google doesn't share phone — keep existing or write your own."
				/>
				<FieldReconciler
					label="Address"
					existing={existingAddress}
					sso={null}
					choice={address.choice}
					edited={address.edited}
					onChange={setAddress}
					hint="Google doesn't share address — keep existing or write your own."
				/>
			</Card>

			{error && <p className="mt-4 text-[13px] text-destructive">{error}</p>}

			<div className="mt-6 flex gap-3">
				<Button
					variant="primary"
					size="lg"
					fullWidth
					onClick={handleContinue}
					disabled={!canSubmit || isPending}
				>
					{isPending ? "Saving…" : "Save & continue"}
				</Button>
			</div>
			<p className="mt-4 text-xs text-muted-foreground">
				You can change these any time from your profile.
			</p>
		</Shell>
	);
};
