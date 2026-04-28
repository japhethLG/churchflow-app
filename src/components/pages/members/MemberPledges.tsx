"use client";

import { Amount, Card, DataTable, SectionTitle, StatusBadge, type DataTableColumn } from "@/components/primitives";
import { usePledges } from "@/lib/api/pledges";
import type { components } from "@/lib/api";

type Pledge = components["schemas"]["PledgeResponseDto"];

const STATUS_LABEL: Record<Pledge["status"], "Active" | "Completed" | "Cancelled"> = {
  ACTIVE: "Active",
  FULFILLED: "Completed",
  CANCELLED: "Cancelled",
};

export const MemberPledges = ({ tenantSlug, memberId }: { tenantSlug: string; memberId: string }) => {
  const { data, isLoading } = usePledges(tenantSlug, { memberId, limit: 10 });
  const items = (data?.items ?? []) as Pledge[];

  const columns: DataTableColumn<Pledge>[] = [
    {
      key: "campaign",
      label: "Campaign",
      render: (p) => <span className="text-foreground">{p.campaignId.slice(0, 8)}…</span>,
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
