"use client";

import { useParams, useRouter } from "next/navigation";
import {
	Amount,
	Badge,
	Button,
	Card,
	DataTable,
	type DataTableColumn,
	DeletedLabel,
	EntityRestoreBanner,
	PageHeader,
	type Status,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMyCampaign, useMyCampaignProgress } from "@/lib/api/campaigns";
import { nstr } from "@/lib/api/coerce";
import { useMyProfile } from "@/lib/api/members";
import { useMyPledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";
import { formatCompact, formatCurrency } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import { cn } from "@/lib/utils";

type Campaign = components["schemas"]["MyCampaignWithItemsResponseDto"];
type Pledge = components["schemas"]["MyPledgeResponseDto"];

const STATUS_MAP: Record<Campaign["status"], Status> = {
	DRAFT: "Upcoming",
	ACTIVE: "Active",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

const PLEDGE_STATUS_MAP: Record<Pledge["status"], Status> = {
	ACTIVE: "Active",
	FULFILLED: "Completed",
	CANCELLED: "Cancelled",
};

const fmtDeadline = (d: string | null): string => {
	if (!d) {
		return "Open-ended · no deadline";
	}
	const date = dayjs(d);
	const days = date.diff(dayjs(), "day");
	const fmt = date.format("MMMM D, YYYY");
	if (days < 0) {
		return `Deadline · ${fmt} (passed)`;
	}
	if (days === 0) {
		return `Deadline · ${fmt} (today)`;
	}
	return `Deadline · ${fmt} (${days} days left)`;
};

export const MemberCampaignDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();

	// Members navigate into a deleted campaign from a pledge/transaction
	// reference — opt into tombstones so the page can render the read-only
	// banner instead of 404'ing.
	const campaignQ = useMyCampaign(tenantSlug, id, { includeDeleted: true });
	const campaign = campaignQ.data;
	const isDeleted = Boolean(campaign?.deletedAt);

	// Progress endpoint stays live-only by design — archived campaigns have
	// no meaningful "in flight" totals. We skip when the campaign itself is
	// archived so the loading shimmer doesn't sit forever.
	const progressQ = useMyCampaignProgress(
		tenantSlug,
		id,
		Boolean(campaign) && !isDeleted,
	);

	const memberQ = useMyProfile(tenantSlug);
	const memberId = memberQ.data?.id;

	// The caller's pledges *to this campaign only*. Backend filters by
	// caller automatically — campaignId narrows further. This is how we
	// surface "Your pledges" alongside the campaign view.
	const pledgesQ = useMyPledges(tenantSlug, { campaignId: id }, Boolean(id));
	const myPledges = pledgesQ.data?.items ?? [];
	const myPledged = myPledges.reduce((s, p) => s + Number(p.pledgedAmount), 0);
	const myPaid = myPledges.reduce((s, p) => s + Number(p.paidAmount), 0);
	const myRemaining = myPledges.reduce(
		(s, p) => s + Number(p.remainingAmount),
		0,
	);
	const myActivePledges = myPledges.filter((p) => p.status === "ACTIVE");

	if (campaignQ.isLoading) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					overline="Campaigns"
					title="Loading…"
					subtitle="Fetching campaign details…"
				/>
				<div className="overflow-auto flex-1 px-8 pb-8">
					<div className="h-60 rounded-2xl bg-secondary animate-pulse" />
				</div>
			</div>
		);
	}

	if (campaignQ.error || !campaign) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					overline="Campaigns"
					title="Not found"
					subtitle="This campaign may have been removed."
					action={
						<Button
							role="secondary"
							onClick={() => router.push(`/${tenantSlug}/member/campaigns`)}
						>
							Back to campaigns
						</Button>
					}
				/>
			</div>
		);
	}

	const items = campaign.items;
	const description = nstr(campaign.description);
	const deadline = nstr(campaign.deadline);

	// Items returned by the self endpoint don't carry per-item aggregates;
	// when progress is available we hydrate from there. When archived,
	// items show their target only.
	const itemProgressById = new Map(
		(progressQ.data?.items ?? []).map((p) => [p.itemId, p]),
	);

	const goal = Number(progressQ.data?.goalAmount ?? 0);
	const raised = Number(progressQ.data?.raisedAmount ?? 0);
	const pledged = Number(progressQ.data?.pledgedAmount ?? 0);
	const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

	const past =
		campaign.status === "COMPLETED" || campaign.status === "CANCELLED";
	const canPledge = !isDeleted && !past && memberId;

	const openPledgeModal = () => {
		// MemberPledgeModal expects tenant-side `CampaignItemResponseDto`
		// shape; the self-side `MyCampaignItemResponseDto` only drops
		// `deletedBy`, so the field set is otherwise identical. Fill in
		// `deletedBy: null` defensively for callsites that expect it.
		openModal("member-pledge", {
			tenantSlug,
			campaignId: campaign.id,
			campaignTitle: campaign.title,
			items: items
				.filter((it) => !it.deletedAt)
				.map((it) => ({
					...it,
					deletedBy: null,
				})),
		});
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Campaigns"
				title={
					isDeleted ? (
						<DeletedLabel deletedAt={campaign.deletedAt}>
							{campaign.title}
						</DeletedLabel>
					) : (
						campaign.title
					)
				}
				subtitle={description ?? "Help your church reach its goal."}
				action={
					<>
						<Button
							role="secondary"
							onClick={() => router.push(`/${tenantSlug}/member/campaigns`)}
						>
							Back
						</Button>
						{canPledge && (
							<Button role="primary" onClick={openPledgeModal}>
								{myActivePledges.length > 0
									? "Add another pledge"
									: "Make a pledge"}
							</Button>
						)}
					</>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8 space-y-4">
				{isDeleted && (
					<EntityRestoreBanner
						entityLabel="Campaign"
						deletedAt={campaign.deletedAt}
						memberVariant
					/>
				)}

				<Card padding={24}>
					<div className="mb-3 flex items-center gap-3">
						<StatusBadge status={STATUS_MAP[campaign.status]} />
						<span className="text-xs text-muted-foreground">
							{fmtDeadline(deadline)}
						</span>
					</div>

					{!isDeleted && (
						<>
							<div className="mb-2 h-2 overflow-hidden rounded bg-muted">
								<div
									className={cn(
										"h-full rounded transition-[width] duration-500 ease-out",
										past
											? "bg-muted-foreground"
											: "bg-linear-to-r from-ring to-primary",
									)}
									style={{ width: goal > 0 ? `${pct}%` : "0%" }}
								/>
							</div>
							<div className="flex justify-between text-xs tabular-nums text-muted-foreground">
								<span>
									{formatCompact(raised)} raised
									{pledged > 0 && ` · ${formatCompact(pledged)} pledged`}
								</span>
								<span>
									{goal > 0 ? `Goal: ${formatCompact(goal)}` : "No goal set"}
								</span>
							</div>
						</>
					)}
				</Card>

				{items.length > 0 && (
					<Card padding={24}>
						<div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
							Campaign items
						</div>
						<div className="flex flex-col gap-3">
							{items.map((item) => {
								const itemProgress = itemProgressById.get(item.id);
								const target = Number(item.targetAmount);
								const itemRaised = Number(itemProgress?.raisedAmount ?? 0);
								const itemPct =
									target > 0 ? Math.min((itemRaised / target) * 100, 100) : 0;
								const itemDeleted = Boolean(item.deletedAt);
								return (
									<div key={item.id} className="flex flex-col">
										<div className="mb-1 flex items-center justify-between text-sm">
											<span className="font-medium text-foreground">
												{itemDeleted ? (
													<DeletedLabel deletedAt={item.deletedAt}>
														{item.title}
													</DeletedLabel>
												) : (
													item.title
												)}
											</span>
											<span className="tabular-nums text-muted-foreground">
												{formatCompact(itemRaised)} / {formatCompact(target)}
											</span>
										</div>
										{!isDeleted && !itemDeleted && (
											<div className="h-1.5 rounded-sm bg-muted">
												<div
													className="h-full rounded-sm bg-primary transition-[width] duration-500"
													style={{ width: `${itemPct}%` }}
												/>
											</div>
										)}
									</div>
								);
							})}
						</div>
					</Card>
				)}

				<Card padding={24}>
					<div className="mb-3 flex items-center justify-between">
						<div className="text-sm font-semibold">Your pledges</div>
						{myPledges.length > 0 && (
							<div className="flex flex-wrap gap-1.5">
								<Badge color="indigo">Pledged {formatCompact(myPledged)}</Badge>
								<Badge color="green">Paid {formatCompact(myPaid)}</Badge>
								{myRemaining > 0 && (
									<Badge color="gray">
										Remaining {formatCompact(myRemaining)}
									</Badge>
								)}
							</div>
						)}
					</div>

					<MyPledgesTable
						rows={myPledges}
						loading={pledgesQ.isLoading}
						onOpen={(p) =>
							router.push(`/${tenantSlug}/member/my-pledges/${p.id}`)
						}
					/>
				</Card>
			</div>
		</div>
	);
};

const myPledgesColumns: DataTableColumn<Pledge>[] = [
	{
		key: "date",
		label: "Pledged on",
		width: "160px",
		render: (p) => (
			<span className="text-sm text-muted-foreground">
				{dayjs(p.createdAt).format("MMM D, YYYY")}
			</span>
		),
	},
	{
		key: "status",
		label: "Status",
		width: "140px",
		render: (p) => <StatusBadge status={PLEDGE_STATUS_MAP[p.status]} />,
	},
	{
		key: "pledged",
		label: "Pledged",
		width: "140px",
		align: "right",
		render: (p) => <Amount value={p.pledgedAmount.toString()} />,
	},
	{
		key: "paid",
		label: "Paid",
		width: "140px",
		align: "right",
		render: (p) => (
			<span
				className={
					Number(p.paidAmount) === 0
						? "tabular-nums text-muted-foreground"
						: "font-semibold tabular-nums text-foreground"
				}
			>
				{formatCurrency(p.paidAmount)}
			</span>
		),
	},
];

const MyPledgesTable = ({
	rows,
	loading,
	onOpen,
}: {
	rows: Pledge[];
	loading?: boolean;
	onOpen?: (p: Pledge) => void;
}) => {
	return (
		<DataTable<Pledge>
			columns={myPledgesColumns}
			rows={rows}
			rowKey={(p) => p.id}
			loading={loading}
			onRowClick={onOpen ? (p) => onOpen(p) : undefined}
			emptyTitle="No pledges yet"
			emptySubtitle="When you pledge to this campaign, your commitments will appear here."
		/>
	);
};
