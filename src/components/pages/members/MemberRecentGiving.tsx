"use client";

import { useRouter } from "next/navigation";
import { Amount, Card, DataTable, SectionTitle, TypeBadge, type DataTableColumn } from "@/components/primitives";
import type { TransactionType } from "@/components/primitives/Badge";
import { useTransactions } from "@/lib/api/transactions";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";

type Tx = components["schemas"]["TransactionResponseDto"];

const TYPE_LABEL: Record<Tx["type"], TransactionType> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

const formatDate = (d: string): string => {
  return dayjs(d).format("MMM D, YYYY");
};

export const MemberRecentGiving = ({ tenantSlug, memberId }: { tenantSlug: string; memberId: string }) => {
  const router = useRouter();
  const { data, isLoading } = useTransactions(tenantSlug, { memberId, limit: 10 });
  const items = (data?.items ?? []) as Tx[];

  const columns: DataTableColumn<Tx>[] = [
    {
      key: "date",
      label: "Date",
      width: "140px",
      render: (t) => <span className="text-muted-foreground">{formatDate(t.date)}</span>,
    },
    {
      key: "type",
      label: "Type",
      width: "140px",
      render: (t) => <TypeBadge type={TYPE_LABEL[t.type]} />,
    },
    {
      key: "amount",
      label: "Amount",
      align: "right",
      render: (t) => <Amount value={t.amount.toString()} />,
    },
  ];

  return (
    <Card padding={24}>
      <SectionTitle title="Recent giving" />
      <DataTable<Tx>
        columns={columns}
        rows={items}
        rowKey={(t) => t.id}
        loading={isLoading}
        loadingRows={3}
        emptyTitle="No giving yet"
        emptySubtitle="Gifts from this member will appear here once recorded."
        onRowClick={(t) => router.push(`/${tenantSlug}/admin/transactions/${t.id}`)}
      />
    </Card>
  );
};
