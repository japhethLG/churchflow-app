"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import {
  TransactionsFilters,
  resolveRange,
  type TransactionsFiltersValue,
} from "./TransactionsFilters";
import { TransactionsSummaryCard } from "./TransactionsSummaryCard";
import { TransactionsTable, type TransactionRow } from "./TransactionsTable";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useTransactionSummary, useTransactions } from "@/lib/api/transactions";
import { nstr, type components } from "@/lib/api";
import { openModal } from "@/lib/modals/store";
import { getCurrencySymbol, formatCurrency } from "@/lib/format-currency";

const PAGE_SIZE = 20;

type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

const DEFAULT_FILTERS: TransactionsFiltersValue = {
  search: "",
  type: "all",
  range: "this-month",
  campaignId: "all",
};

// Map the UI period chip onto how many trailing months the summary
// endpoint should aggregate.
const rangeToMonths = (range: TransactionsFiltersValue["range"]): number  => {
  switch (range) {
    case "today":
    case "this-month":
      return 1;
    case "last-month":
      return 2;
    case "ytd":
      return new Date().getUTCMonth() + 1;
    default:
      return 12;
  }
}

export const TransactionsListPage = () => {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const [filters, setFilters] = useState<TransactionsFiltersValue>(DEFAULT_FILTERS);
  const [offset, setOffset] = useState(0);

  const { data: campaignsData } = useCampaigns(tenantSlug);
  const { data: membersData } = useMembers(tenantSlug, { limit: 200 });

  const campaigns: Campaign[] = campaignsData?.items ?? [];
  const members: Member[] = membersData?.items ?? [];
  const campaignsById: Record<string, Campaign> = Object.fromEntries(campaigns.map((c) => [c.id, c]));
  const membersById: Record<string, Member> = Object.fromEntries(members.map((m) => [m.id, m]));

  const dateRange = resolveRange(filters.range);
  const months = rangeToMonths(filters.range);
  const summary = useTransactionSummary(tenantSlug, months);

  const list = useTransactions(tenantSlug, {
    type: filters.type === "all" ? undefined : filters.type,
    campaignId: filters.campaignId === "all" ? undefined : filters.campaignId,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    offset,
    limit: PAGE_SIZE,
  });

  const allItems: TransactionRow[] = list.data?.items ?? [];
  const total = list.data?.meta.total ?? 0;

  // Search across note + reference number, client-side over the page.
  const visible = useMemo<TransactionRow[]>(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((t) =>
      `${nstr(t.note) ?? ""} ${nstr(t.referenceNumber) ?? ""}`.toLowerCase().includes(q)
    );
  }, [allItems, filters.search]);

  const openRecord = () => openModal("record-gift", { tenantSlug });
  const openView = (t: TransactionRow) => router.push(`/${tenantSlug}/admin/transactions/${t.id}`);
  const openEdit = openView; // detail page hosts edit affordance
  const openDelete = (t: TransactionRow) =>
    openModal("confirm-delete-transaction", {
      tenantSlug,
      transactionId: t.id,
      amountLabel: formatCurrency(t.amount, { currency: t.currency }),
    });

  return (
    <div className="h-full overflow-auto">
      <PageHeader
        overline="Ledger"
        title="Transactions"
        subtitle="Every gift recorded at this church."
        action={
          <>
            <Button variant="secondary" icon="download" disabled>
              Export
            </Button>
            <Button variant="primary" icon="plus" onClick={openRecord}>
              Record gift
            </Button>
          </>
        }
      />

      <TransactionsFilters
        value={filters}
        campaigns={campaigns}
        onChange={(v) => {
          setFilters(v);
          setOffset(0);
        }}
        onReset={() => {
          setFilters(DEFAULT_FILTERS);
          setOffset(0);
        }}
      />

      <TransactionsSummaryCard
        summary={summary.data}
        loading={summary.isLoading}
        months={months}
        onMonthsChange={(m) => {
          // Period switch on the KPI bar updates the list filter so the
          // numbers stay in sync with the table below.
          const range: TransactionsFiltersValue["range"] =
            m === 1 ? "this-month" : m === 2 ? "last-month" : m === 12 ? "all" : "ytd";
          setFilters((f) => ({ ...f, range }));
          setOffset(0);
        }}
      />

      <TransactionsTable
        rows={visible}
        loading={list.isLoading}
        pagination={{ total, offset, limit: PAGE_SIZE, onChange: setOffset }}
        membersById={membersById}
        campaignsById={campaignsById}
        handlers={{ onView: openView, onEdit: openEdit, onDelete: openDelete }}
        onCreate={openRecord}
      />
    </div>
  );
}
