"use client";

import {
	Amount,
	Card,
	DataTable,
	type DataTableColumn,
	DeletedLabel,
	SectionTitle,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";

type Pledge = components["schemas"]["PledgeResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const STATUS_LABEL: Record<
	Pledge["status"],
	"Active" | "Completed" | "Cancelled"
> = {
	ACTIVE: "Active",
	FULFILLED: "Completed",
	CANCELLED: "Cancelled",
};

export const MemberPledges = ({
	tenantSlug,
	memberId,
}: {
	tenantSlug: string;
	memberId: string;
}) => {
	const { data, isLoading } = usePledges(tenantSlug, { memberId, limit: 10 });
	const { data: campaignsData } = useCampaigns(tenantSlug, {
		includeDeleted: true,
	});
	const items = (data?.items ?? []) as Pledge[];
	const campaignsById: Record<string, Campaign> = Object.fromEntries(
		(campaignsData?.items ?? []).map((c) => [c.id, c]),
	);

	const columns: DataTableColumn<Pledge>[] = [
		{
			key: "campaign",
			label: "Campaign",
			render: (p) => {
				const c = campaignsById[p.campaignId];
				if (!c) {
					return (
						<span className="text-muted-foreground">
							{p.campaignId.slice(0, 8)}…
						</span>
					);
				}
				if (c.deletedAt) {
					return <DeletedLabel deletedAt={c.deletedAt}>{c.title}</DeletedLabel>;
				}
				return <span className="text-foreground">{c.title}</span>;
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
	];

	return (
		<Card padding={24}>
			<SectionTitle title="Pledges" />
			<DataTable<Pledge>
				columns={columns}
				rows={items}
				rowKey={(p) => p.id}
				loading={isLoading}
				loadingRows={2}
				emptyTitle="No pledges"
				emptySubtitle="Active pledges from this member will appear here."
			/>
		</Card>
	);
};
