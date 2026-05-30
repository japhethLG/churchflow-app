"use client";

import { useRouter } from "next/navigation";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { Button, Input, Pressable, Textarea } from "@/components/primitives";
import { useIssueInvitation } from "@/lib/api/invitations";
import { useCreateTenant, useSlugSuggestion } from "@/lib/api/tenants";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

type Draft = {
	name: string;
	slug: string;
	description: string;
};

const Stepper = ({ step }: { step: Step }) => {
	const steps = ["Details", "Invite admins", "Done"];
	return (
		<div className="mb-8 flex items-center justify-center gap-1">
			{steps.map((label, i) => {
				const idx = (i + 1) as Step;
				const isActive = idx === step;
				const isDone = idx < step;
				return (
					<div key={label} className="flex items-center gap-1">
						<div
							className={cn(
								"rounded-full px-4 py-1.5 text-xs font-semibold",
								isActive && "bg-accent text-primary",
								isDone && !isActive && "bg-input text-foreground",
								!isActive && !isDone && "bg-secondary text-muted-foreground",
							)}
						>
							{isDone ? "✓ " : ""}
							{label}
						</div>
						{i < steps.length - 1 && (
							<div className="h-px w-6 bg-border" aria-hidden />
						)}
					</div>
				);
			})}
		</div>
	);
};

const Step1Details = ({
	draft,
	setDraft,
	onNext,
	onCancel,
}: {
	draft: Draft;
	setDraft: Dispatch<SetStateAction<Draft>>;
	onNext: () => void;
	onCancel: () => void;
}) => {
	const [slugEdited, setSlugEdited] = useState(false);
	const debouncedName = useDebouncedValue(draft.name, 300);
	const { data: suggestion } = useSlugSuggestion(
		debouncedName,
		debouncedName.length >= 3 && !slugEdited,
	);

	useEffect(() => {
		const suggestionSlug = suggestion?.slug;
		if (!slugEdited && suggestionSlug) {
			setDraft((prev) => {
				if (prev.slug === suggestionSlug) {
					return prev;
				}
				return { ...prev, slug: suggestionSlug };
			});
		}
	}, [suggestion?.slug, slugEdited, setDraft]);

	return (
		<>
			<div className="mb-2">
				<div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
					Platform
				</div>
				<h1 className="m-0 text-2xl font-semibold tracking-tight">
					New church.
				</h1>
				<p className="mt-2 text-sm text-secondary-foreground">
					Set up the church profile. You&apos;ll invite admins in the next step.
				</p>
			</div>

			<div className="mt-8 flex flex-col gap-4">
				<Input
					label="Church name"
					value={draft.name}
					onChange={(e) => setDraft({ ...draft, name: e.target.value })}
					placeholder="Grace Community Church"
				/>
				<div>
					<Input
						label="Slug"
						value={draft.slug}
						onChange={(e) => {
							setSlugEdited(true);
							setDraft({
								...draft,
								slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
							});
						}}
						placeholder="grace-community"
					/>
					{draft.slug && (
						<div className="mt-1 text-xs text-muted-foreground">
							URL: /{draft.slug}/admin/dashboard
						</div>
					)}
				</div>
				<Textarea
					label={
						<>
							Description{" "}
							<span className="font-normal text-muted-foreground">
								(optional)
							</span>
						</>
					}
					value={draft.description}
					onChange={(e) =>
						setDraft((prev) => ({ ...prev, description: e.target.value }))
					}
					rows={3}
					placeholder="Brief description of this church…"
				/>
			</div>

			<div className="mt-8 flex justify-between">
				<Button role="secondary" recipe="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button
					role="primary"
					onClick={onNext}
					disabled={!draft.name.trim() || !draft.slug.trim()}
				>
					Next: Invite admins →
				</Button>
			</div>
		</>
	);
};

const Step2Invites = ({
	tenantId,
	tenantName,
	onNext,
	onBack,
}: {
	tenantId: string;
	tenantName: string;
	onNext: (invitesSent: number) => void;
	onBack: () => void;
}) => {
	const [emails, setEmails] = useState<string[]>([]);
	const [input, setInput] = useState("");
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [sending, setSending] = useState(false);
	const { mutateAsync: sendInvite } = useIssueInvitation();

	const addEmail = () => {
		const trimmed = input.trim().toLowerCase();
		if (!trimmed || emails.includes(trimmed)) {
			setInput("");
			return;
		}
		setEmails((prev) => [...prev, trimmed]);
		setInput("");
	};

	const removeEmail = (email: string) => {
		setEmails((prev) => prev.filter((e) => e !== email));
		setErrors((prev) => {
			const n = { ...prev };
			delete n[email];
			return n;
		});
	};

	const handleSend = async () => {
		setSending(true);
		const results: Record<string, string> = {};
		for (const email of emails) {
			try {
				await sendInvite({
					params: { path: { tenantId } },
					body: { email, role: "ADMIN" },
				});
			} catch (err) {
				results[email] = err instanceof Error ? err.message : "Failed";
			}
		}
		setErrors(results);
		setSending(false);
		const succeeded = emails.filter((e) => !results[e]).length;
		onNext(succeeded);
	};

	return (
		<>
			<div className="mb-2">
				<div className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
					{tenantName}
				</div>
				<h1 className="m-0 text-2xl font-semibold tracking-tight">
					Invite admins.
				</h1>
				<p className="mt-2 text-sm text-secondary-foreground">
					Optional. Invite the first admins now, or do it later from the church
					page.
				</p>
			</div>

			<div className="mt-8 flex flex-col gap-3">
				<div className="flex gap-2">
					<Input
						type="email"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === ",") {
								e.preventDefault();
								addEmail();
							}
						}}
						placeholder="admin@example.com"
					/>
					<Button role="secondary" onClick={addEmail} disabled={!input.trim()}>
						Add
					</Button>
				</div>

				{emails.length > 0 && (
					<div className="flex flex-wrap gap-2">
						{emails.map((email) => (
							<div
								key={email}
								className={cn(
									"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm",
									errors[email]
										? "bg-destructive/10 text-destructive"
										: "bg-input text-foreground",
								)}
							>
								{email}
								{errors[email] && (
									<span className="text-xs">({errors[email]})</span>
								)}
								<Pressable
									onClick={() => removeEmail(email)}
									className="ml-0.5 border-0 bg-transparent p-0 text-inherit hover:opacity-80"
								>
									×
								</Pressable>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="mt-8 flex justify-between">
				<Button
					role="secondary"
					recipe="outline"
					onClick={onBack}
					disabled={sending}
				>
					← Back
				</Button>
				<div className="flex gap-2">
					<Button role="secondary" onClick={() => onNext(0)} disabled={sending}>
						Skip
					</Button>
					{emails.length > 0 && (
						<Button role="primary" onClick={handleSend} disabled={sending}>
							{sending
								? "Sending…"
								: `Send ${emails.length} invite${emails.length !== 1 ? "s" : ""}`}
						</Button>
					)}
				</div>
			</div>
		</>
	);
};

const Step3Success = ({
	tenantName,
	tenantSlug,
	invitesSent,
}: {
	tenantName: string;
	tenantSlug: string;
	invitesSent: number;
}) => {
	const router = useRouter();
	return (
		<div className="py-6 text-center">
			<div className="mb-4 text-5xl leading-none">✓</div>
			<h2 className="m-0 text-2xl font-semibold tracking-tight">
				{tenantName} created.
			</h2>
			{invitesSent > 0 && (
				<p className="mt-3 text-sm text-secondary-foreground">
					{invitesSent} admin invite{invitesSent !== 1 ? "s" : ""} sent.
				</p>
			)}
			<div className="mt-8 flex flex-wrap justify-center gap-3">
				<Button
					role="secondary"
					onClick={() => router.push("/super-admin/tenants")}
				>
					Back to churches
				</Button>
				<Button
					role="primary"
					onClick={() => router.push(`/super-admin/tenants/${tenantSlug}`)}
				>
					Go to {tenantName} →
				</Button>
			</div>
		</div>
	);
};

export const NewTenantPage = () => {
	const router = useRouter();
	const [step, setStep] = useState<Step>(1);
	const [draft, setDraft] = useState<Draft>({
		name: "",
		slug: "",
		description: "",
	});
	const [createdTenant, setCreatedTenant] = useState<{
		id: string;
		slug: string;
	} | null>(null);
	const [invitesSent, setInvitesSent] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync: createTenant, isPending: creating } = useCreateTenant();

	const handleStep1Next = async () => {
		setError(null);
		try {
			const t = await createTenant({
				params: {},
				body: { name: draft.name.trim(), slug: draft.slug.trim() },
			});
			if (t) {
				setCreatedTenant({
					id: (t as { id: string }).id,
					slug: (t as { slug: string }).slug,
				});
			}
			setStep(2);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create church");
		}
	};

	return (
		<div className="mx-auto max-w-[560px] px-4 pt-10 pb-28 md:px-6 md:py-10">
			<Stepper step={step} />

			{step === 1 && (
				<>
					<Step1Details
						draft={draft}
						setDraft={setDraft}
						onNext={handleStep1Next}
						onCancel={() => router.push("/super-admin/tenants")}
					/>
					{creating && (
						<p className="mt-2 text-sm text-muted-foreground">Creating…</p>
					)}
					{error && <p className="mt-2 text-sm text-destructive">{error}</p>}
				</>
			)}

			{step === 2 && createdTenant && (
				<Step2Invites
					tenantId={createdTenant.id}
					tenantName={draft.name}
					onNext={(sent) => {
						setInvitesSent(sent);
						setStep(3);
					}}
					onBack={() => setStep(1)}
				/>
			)}

			{step === 3 && createdTenant && (
				<Step3Success
					tenantName={draft.name}
					tenantSlug={createdTenant.slug}
					invitesSent={invitesSent}
				/>
			)}
		</div>
	);
};
