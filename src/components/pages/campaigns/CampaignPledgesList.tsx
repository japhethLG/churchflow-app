"use client";

import {
	Amount,
	Avatar,
	Button,
	Card,
	DataTable,
	type DataTableColumn,
	DeletedLabel,
	RowActionsMenu,
	SectionTitle,
	type Status,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import dayjs from "@/lib/dayjs";

type Pledge = components["schemas"]["PledgeResponseDto"];
type Item = components["schemas"]["CampaignItemResponseDto"];

const STATUS_LABEL: Record<Pledge["status"], Status> = {
	ACTIVE: "Active",
	FULFILLED: "Completed",
	CANCELLED: "Cancelled",
};

const fullName = (
	m: { firstName: string; lastName: string } | undefined,
): string => {
	if (!m) {
		return "Unknown member";
	}
	return `${m.firstName} ${m.lastName}`.trim();
};

export const CampaignPledgesList = ({
	tenantSlug,
	campaignId,
	campaignTitle,
	items,
	onCreate,
	onEdit,
	onDelete,
	parentDeleted,
}: {
	tenantSlug: string;
	campaignId: string;
	campaignTitle: string;
	items: Item[];
	onCreate: () => void;
	onEdit: (p: Pledge) => void;
	onDelete: (p: Pledge) => void;
	/** True when the parent campaign is archived — disables mutations. */
	parentDeleted?: boolean;
}) => {
	const { data: pledgesData, isLoading } = usePledges(tenantSlug, {
		campaignId,
		limit: 50,
	});
	// Pull members so we can render names — small tenants only; fine for v1.
	// Include deleted so we can apply Mode-B treatment to pledges from
	// archived members.
	const { data: membersData } = useMembers(tenantSlug, {
		limit: 200,
		includeDeleted: true,
	});

	const pledges = pledgesData?.items ?? [];
	const itemById: Record<string, Item> = Object.fromEntries(
		items.map((i) => [i.id, i]),
	);
	const memberById: Record<
		string,
		{ firstName: string; lastName: string; deletedAt?: unknown }
	> = Object.fromEntries(
		(membersData?.items ?? []).map((m) => [
			m.id,
			{
				firstName: m.firstName,
				lastName: m.lastName,
				deletedAt: m.deletedAt,
			},
		]),
	);

	const columns: DataTableColumn<Pledge>[] = [
		{
			key: "member",
			label: "Member",
			render: (p) => {
				const m = memberById[p.memberId];
				const name = fullName(m);
				return (
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 10,
							minWidth: 0,
						}}
					>
						<Avatar name={name} size={28} />
						{m?.deletedAt ? (
							<DeletedLabel deletedAt={m.deletedAt} className="font-medium">
								{name}
							</DeletedLabel>
						) : (
							<span
								style={{
									fontWeight: 500,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{name}
							</span>
						)}
					</span>
				);
			},
		},
		{
			key: "scope",
			label: "Campaign",
			width: "240px",
			render: (p) => {
				const itemId =
					typeof p.campaignItemId === "string" ? p.campaignItemId : null;
				const linkedItem = itemId ? itemById[itemId] : undefined;
				const itemTitle = linkedItem?.title ?? null;
				const itemDeleted = Boolean(linkedItem?.deletedAt);
				return (
					<span style={{ fontSize: 13, color: "var(--foreground)" }}>
						{campaignTitle}
						{itemTitle &&
							(itemDeleted ? (
								<span style={{ marginLeft: 4 }}>
									[
									<DeletedLabel deletedAt={linkedItem?.deletedAt}>
										{itemTitle}
									</DeletedLabel>
									]
								</span>
							) : (
								<span
									style={{ color: "var(--muted-foreground)", marginLeft: 4 }}
								>
									[{itemTitle}]
								</span>
							))}
					</span>
				);
			},
		},
		{
			key: "amount",
			label: "Pledged",
			width: "140px",
			align: "right",
			render: (p) => <Amount value={p.pledgedAmount.toString()} />,
		},
		{
			key: "status",
			label: "Status",
			width: "120px",
			render: (p) => <StatusBadge status={STATUS_LABEL[p.status]} />,
		},
		{
			key: "created",
			label: "Pledged on",
			width: "130px",
			render: (p) => (
				<span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
					{dayjs(p.createdAt).format("MMM D")}
				</span>
			),
		},
		{
			key: "actions",
			label: "",
			width: "48px",
			align: "right",
			overflow: "visible",
			render: (p) => {
				if (parentDeleted || p.deletedAt) {
					return <RowActionsMenu actions={[]} />;
				}
				return (
					<RowActionsMenu
						actions={[
							{ label: "Edit", onClick: () => onEdit(p) },
							{
								label: "Delete",
								onClick: () => onDelete(p),
								destructive: true,
								separatorBefore: true,
							},
						]}
					/>
				);
			},
		},
	];

	return (
		<Card padding={24}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<SectionTitle title="Pledges" />
				<Button
					variant="secondary"
					size="sm"
					icon="plus"
					onClick={onCreate}
					disabled={parentDeleted}
				>
					Add pledge
				</Button>
			</div>
			<DataTable<Pledge>
				columns={columns}
				rows={pledges}
				rowKey={(p) => p.id}
				loading={isLoading}
				emptyTitle="No pledges yet"
				emptySubtitle="Add a pledge to track a member's commitment toward this campaign."
			/>
		</Card>
	);
};
