"use client";

import { useParams, useRouter } from "next/navigation";
import {
	Amount,
	Avatar,
	Button,
	Card,
	PageHeader,
	SectionTitle,
	TypeBadge,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaign } from "@/lib/api/campaigns";
import { useMember } from "@/lib/api/members";
import { usePledge } from "@/lib/api/pledges";
import { useTransaction } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import { cn } from "@/lib/utils";

type Tx = components["schemas"]["TransactionResponseDto"];

const TYPE_BADGE_LABEL: Record<
	Tx["type"],
	| "Tithe"
	| "Offering"
	| "Mission"
	| "First Fruit"
	| "Commitment"
	| "Donation"
	| "Other"
> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

export const TransactionDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
	const { data: tx, isLoading, error } = useTransaction(tenantSlug, id);

	const memberId = nstr(tx?.memberId);
	const campaignId = nstr(tx?.campaignId);
	const pledgeId = nstr(tx?.pledgeId);
	const campaignItemId = nstr(tx?.campaignItemId);

	const memberQ = useMember(tenantSlug, memberId ?? "", Boolean(memberId));
	const campaignQ = useCampaign(
		tenantSlug,
		campaignId ?? "",
		Boolean(campaignId),
	);
	const pledgeQ = usePledge(tenantSlug, pledgeId ?? "", Boolean(pledgeId));

	if (isLoading) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					overline="Ledger / Transactions"
					title="Loading..."
					subtitle="Fetching transaction details..."
				/>
				<div className="overflow-auto flex-1 px-8 pb-8 flex flex-col gap-4">
					<div className="h-60 rounded-2xl bg-secondary animate-pulse" />
				</div>
			</div>
		);
	}

	if (error || !tx) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					overline="Ledger / Transactions"
					title="Not Found"
					subtitle="This transaction may have been deleted."
				/>
				<div className="overflow-auto flex-1 px-8 pb-8 text-center text-muted-foreground flex flex-col items-center justify-center">
					<p className="mb-4 text-base font-medium text-foreground">
						Transaction not found
					</p>
					<Button
						variant="secondary"
						onClick={() => router.push(`/${tenantSlug}/admin/transactions`)}
					>
						Back to transactions
					</Button>
				</div>
			</div>
		);
	}

	const member = memberQ.data;
	const campaign = campaignQ.data;
	const pledge = pledgeQ.data;
	const itemTitle =
		campaignItemId && campaign?.items
			? (campaign.items.find((it) => it.id === campaignItemId)?.title ?? null)
			: null;

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Ledger / Transactions"
				title={formatCurrency(tx.amount)}
				subtitle={`${TYPE_BADGE_LABEL[tx.type]} · ${dayjs(tx.date).format("dddd, MMMM D, YYYY")}`}
				action={
					<>
						<Button
							variant="secondary"
							onClick={() => router.push(`/${tenantSlug}/admin/transactions`)}
						>
							Back
						</Button>
						<Button
							variant="tertiary"
							destructive
							icon="trash"
							onClick={() =>
								openModal("confirm-delete-transaction", {
									tenantSlug,
									transactionId: tx.id,
									amountLabel: formatCurrency(tx.amount),
									onDeleted: () =>
										router.push(`/${tenantSlug}/admin/transactions`),
								})
							}
						>
							Delete
						</Button>
					</>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<div className="grid grid-cols-[1.5fr_1fr] items-start gap-4">
					<Card padding={24}>
						<SectionTitle title="Details" />
						<DetailRow label="Amount" value={<Amount value={tx.amount} />} />
						<DetailRow
							label="Type"
							value={<TypeBadge type={TYPE_BADGE_LABEL[tx.type]} />}
						/>
						<DetailRow
							label="Reference #"
							value={
								nstr(tx.referenceNumber) ? (
									<span className="font-mono text-[13px] text-muted-foreground">
										{nstr(tx.referenceNumber)}
									</span>
								) : (
									<span className="text-muted-foreground">—</span>
								)
							}
						/>
						<DetailRow
							label="Recorded on"
							value={dayjs(tx.createdAt).format("MMM D, YYYY h:mm A")}
							last
						/>
						{nstr(tx.note) && (
							<>
								<div className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
									Note
								</div>
								<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
									{nstr(tx.note)}
								</p>
							</>
						)}
					</Card>

					<Card padding={24}>
						<SectionTitle title="Attribution" />

						<div className="flex flex-col gap-3.5">
							{/* Member */}
							<div>
								<Label>Member</Label>
								{member ? (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-auto gap-2.5 bg-transparent p-0 text-left font-sans shadow-none hover:bg-muted/60"
										onClick={() =>
											router.push(`/${tenantSlug}/admin/members/${member.id}`)
										}
									>
										<span className="flex items-center gap-2.5">
											<Avatar
												name={`${member.firstName} ${member.lastName}`}
												size={32}
											/>
											<span className="text-sm font-medium">
												{member.firstName} {member.lastName}
											</span>
										</span>
									</Button>
								) : (
									<span className="text-sm italic text-muted-foreground">
										Anonymous gift
									</span>
								)}
							</div>

							{/* Campaign + item */}
							<div>
								<Label>Campaign</Label>
								{campaign ? (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-auto px-0 py-0 text-sm font-medium text-primary shadow-none hover:bg-transparent hover:text-primary/90 hover:underline"
										onClick={() =>
											router.push(`/${tenantSlug}/admin/campaigns/${campaign.id}`)
										}
									>
										{campaign.title}
									</Button>
								) : (
									<span className="text-sm text-muted-foreground">
										Not attributed
									</span>
								)}
								{itemTitle && (
									<div className="mt-1 text-xs text-muted-foreground">
										Earmarked to <strong>{itemTitle}</strong>
									</div>
								)}
							</div>

							{/* Pledge */}
							<div>
								<Label>Pledge</Label>
								{pledge ? (
									<span className="text-sm">
										{formatCurrency(pledge.pledgedAmount)} pledged · status{" "}
										<strong>{pledge.status.toLowerCase()}</strong>
									</span>
								) : (
									<span className="text-sm text-muted-foreground">Unpledged</span>
								)}
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
};

const DetailRow = ({
	label,
	value,
	last,
}: {
	label: string;
	value: React.ReactNode;
	last?: boolean;
}) => {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-4 border-b border-secondary py-2.5",
				last && "border-b-0",
			)}
		>
			<span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
				{label}
			</span>
			<span className="text-right text-sm font-medium">{value}</span>
		</div>
	);
};

const Label = ({ children }: { children: React.ReactNode }) => {
	return (
		<div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
			{children}
		</div>
	);
};
