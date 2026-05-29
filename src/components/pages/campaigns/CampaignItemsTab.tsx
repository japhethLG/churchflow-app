"use client";

import { useState } from "react";
import {
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	DeletedLabel,
	RowActionsMenu,
	StackedProgressBar,
	type StateFilterValue,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";
import { useCampaign } from "@/lib/api/campaigns";
import dayjs from "@/lib/dayjs";
import { formatCompact } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import { daysUntil, num, pct } from "../admin-shared";

type Campaign = components["schemas"]["CampaignWithItemsResponseDto"];
type Item = components["schemas"]["CampaignItemResponseDto"];
type ItemProgress = components["schemas"]["CampaignItemProgressDto"];

type ItemLifecycle = "funded" | "past-due" | "due-soon" | "on-track" | "open";

const itemLifecycle = (
	deadline: string | null,
	pct100: number,
): ItemLifecycle => {
	if (pct100 >= 100) {
		return "funded";
	}
	const d = daysUntil(deadline);
	if (d === null) {
		return "open";
	}
	if (d < 0) {
		return "past-due";
	}
	if (d <= 14) {
		return "due-soon";
	}
	return "on-track";
};

const LIFECYCLE_LABEL: Record<ItemLifecycle, string> = {
	funded: "Funded",
	"past-due": "Past due",
	"due-soon": "Due soon",
	"on-track": "On track",
	open: "Open",
};

const LIFECYCLE_COLOR: Record<
	ItemLifecycle,
	"green" | "red" | "amber" | "blue" | "neutral"
> = {
	funded: "green",
	"past-due": "red",
	"due-soon": "amber",
	"on-track": "blue",
	open: "neutral",
};

type Row = {
	item: Item;
	progress: ItemProgress | undefined;
	target: number;
	pledged: number;
	raised: number;
	raisedPct: number;
	deadline: string | null;
	days: number | null;
	lifecycle: ItemLifecycle;
};

export const CampaignItemsTab = ({
	campaign,
	progressByItemId,
	tenantSlug,
	parentDeleted,
}: {
	campaign: Campaign;
	progressByItemId: Record<string, ItemProgress>;
	tenantSlug: string;
	parentDeleted: boolean;
}) => {
	const [state, setState] = useState<StateFilterValue>("active");

	// Always pull both active and archived items; filter client-side. The
	// `useCampaign` flags also gate which campaign rows are returned (not
	// just items), so passing the state filter through would 404 a deleted
	// parent on `active`. Items per campaign are small, so JS filtering is fine.
	const { data: refreshed, isLoading } = useCampaign(tenantSlug, campaign.id, {
		includeDeleted: true,
	});

	const allItems: Item[] = refreshed?.items ?? campaign.items;
	const items: Item[] =
		state === "active"
			? allItems.filter((i) => !i.deletedAt)
			: state === "deleted"
				? allItems.filter((i) => Boolean(i.deletedAt))
				: allItems;

	const rows: Row[] = items.map((item) => {
		const target = num(item.targetAmount);
		const progress = progressByItemId[item.id];
		const pledged = num(progress?.pledgedAmount);
		const raised = num(progress?.raisedAmount);
		const raisedPct = pct(raised, target);
		const deadline = nstr(item.deadline);
		return {
			item,
			progress,
			target,
			pledged,
			raised,
			raisedPct,
			deadline,
			days: daysUntil(deadline),
			lifecycle: itemLifecycle(deadline, raisedPct),
		};
	});

	const openAdd = () =>
		openModal("add-campaign-item", {
			tenantSlug,
			campaignId: campaign.id,
			defaultSortOrder: items.length,
		});
	const openEdit = (item: Item) =>
		openModal("edit-campaign-item", {
			tenantSlug,
			campaignId: campaign.id,
			item,
		});
	const openDelete = (item: Item) =>
		openModal("confirm-delete-campaign-item", {
			tenantSlug,
			campaignId: campaign.id,
			itemId: item.id,
			itemTitle: item.title,
		});
	const openRestore = (item: Item) =>
		openModal("confirm-restore-campaign-item", {
			tenantId: tenantSlug,
			campaignId: campaign.id,
			itemId: item.id,
			itemTitle: item.title,
		});

	const columns: DataTableColumn<Row>[] = [
		{
			key: "item",
			label: "Item",
			render: (r) => (
				<div className="min-w-0">
					<div className="text-sm font-semibold text-foreground">
						{r.item.deletedAt ? (
							<DeletedLabel deletedAt={r.item.deletedAt}>
								{r.item.title}
							</DeletedLabel>
						) : (
							r.item.title
						)}
					</div>
					{nstr(r.item.description) && (
						<div className="mt-0.5 truncate text-xs text-muted-foreground">
							{nstr(r.item.description)}
						</div>
					)}
				</div>
			),
		},
		{
			key: "progress",
			label: "Progress",
			width: "280px",
			render: (r) => (
				<div>
					<StackedProgressBar
						size="sm"
						total={r.target}
						segments={[
							{
								value: r.pledged,
								color:
									"color-mix(in srgb, var(--chart-current) 28%, transparent)",
								label: "Pledged",
							},
							{
								value: r.raised,
								color: "var(--chart-current)",
								label: "Raised",
							},
						]}
					/>
					<div className="mt-1 flex items-baseline justify-between text-xs tabular-nums">
						<span className="text-muted-foreground">
							{formatCompact(r.raised)} / {formatCompact(r.target)}
						</span>
						<span className="font-semibold text-foreground">
							{r.raisedPct}%
						</span>
					</div>
				</div>
			),
		},
		{
			key: "target",
			label: "Target",
			width: "100px",
			align: "right",
			render: (r) => (
				<span className="text-sm font-medium tabular-nums text-foreground">
					{formatCompact(r.target)}
				</span>
			),
		},
		{
			key: "deadline",
			label: "Deadline",
			width: "140px",
			render: (r) => (
				<div className="text-xs">
					{r.deadline ? (
						<div className="text-muted-foreground">
							{dayjs(r.deadline).format("MMM D, YYYY")}
						</div>
					) : (
						<div className="text-muted-foreground">—</div>
					)}
					<Badge color={LIFECYCLE_COLOR[r.lifecycle]} className="mt-0.5">
						{LIFECYCLE_LABEL[r.lifecycle]}
						{r.days !== null && r.lifecycle !== "funded" && (
							<>
								{" · "}
								{r.days < 0 ? `${Math.abs(r.days)}d past` : `${r.days}d left`}
							</>
						)}
					</Badge>
				</div>
			),
		},
		{
			key: "actions",
			label: "",
			width: "48px",
			align: "right",
			overflow: "visible",
			render: (r) => (
				<RowActionsMenu
					actions={
						r.item.deletedAt
							? [{ label: "Restore", onClick: () => openRestore(r.item) }]
							: parentDeleted
								? []
								: [
										{ label: "Edit", onClick: () => openEdit(r.item) },
										{
											label: "Delete",
											onClick: () => openDelete(r.item),
											destructive: true,
											separatorBefore: true,
										},
									]
					}
				/>
			),
		},
	];

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button
					role="primary"
					icon="plus"
					onClick={openAdd}
					disabled={parentDeleted}
				>
					Add item
				</Button>
			</div>
			<DataTableShell<Row>
				filters={[{ kind: "state", value: state, onChange: setState }]}
				columns={columns}
				rows={rows}
				rowKey={(r) => r.item.id}
				loading={isLoading}
				rowClassName={(r) => (r.item.deletedAt ? "bg-muted/30" : undefined)}
				emptyTitle="No line items yet"
				emptySubtitle="The campaign goal is the sum of its items' targets — add at least one to start tracking pledges."
				emptyAction={
					!parentDeleted ? (
						<Button role="primary" icon="plus" onClick={openAdd}>
							Add item
						</Button>
					) : undefined
				}
			/>
		</div>
	);
};
