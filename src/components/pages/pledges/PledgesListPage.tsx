"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import {
  PledgesFilters,
  type PledgesFiltersValue,
} from "./PledgesFilters";
import { PledgesStatsBar } from "./PledgesStatsBar";
import { PledgesTable, type PledgeRow } from "./PledgesTable";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import { openModal } from "@/lib/modals/store";
import type { components } from "@/lib/api";

const PAGE_SIZE = 20;

type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

export const PledgesListPage = () => {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const [filters, setFilters] = useState<PledgesFiltersValue>({
    campaignId: "all",
    status: "all",
    search: "",
  });
  const [offset, setOffset] = useState(0);

  const { data: campaignsData } = useCampaigns(tenantSlug);
  const { data: membersData } = useMembers(tenantSlug, { limit: 200 });

  const { data: pledgesData, isLoading } = usePledges(tenantSlug, {
    campaignId: filters.campaignId === "all" ? undefined : filters.campaignId,
    status: filters.status === "all" ? undefined : filters.status,
    offset,
    limit: PAGE_SIZE,
  });

  const campaigns: Campaign[] = campaignsData?.items ?? [];
  const members: Member[] = membersData?.items ?? [];
  const campaignsById: Record<string, Campaign> = Object.fromEntries(campaigns.map((c) => [c.id, c]));
  const membersById: Record<string, Member> = Object.fromEntries(members.map((m) => [m.id, m]));

  const allItems: PledgeRow[] = pledgesData?.items ?? [];
  const total = pledgesData?.meta.total ?? 0;
  const totalAmount = pledgesData?.meta.sum ?? 0;

  // Note search is client-side over the current page; server filter is on
  // status + campaignId already. Notes aren't indexed, so server search
  // would need its own query — not worth it for the scale we have.
  const visible = useMemo<PledgeRow[]>(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((p) => (p.note ?? "").toLowerCase().includes(q));
  }, [allItems, filters.search]);

  const counts = {
    active: allItems.filter((p) => p.status === "ACTIVE").length,
    fulfilled: allItems.filter((p) => p.status === "FULFILLED").length,
  };

  const askEdit = (p: PledgeRow) => {
    openModal("edit-pledge", { tenantSlug, pledge: p });
  };
  const askDelete = (p: PledgeRow) =>
    openModal("confirm-delete-pledge", { tenantSlug, pledgeId: p.id });

  const openCreate = () => {
    if (campaigns.length === 0) return;
    const c = campaigns.find((x) => x.status === "ACTIVE") ?? campaigns[0];
    openModal("create-pledge", {
      tenantSlug,
      campaignId: c.id,
      campaignTitle: c.title,
      items: [],
    });
  };

  return (
    <div className="h-full overflow-auto">
      <PageHeader
        overline="Fundraising"
        title="Pledges"
        subtitle="Every commitment, across every active campaign."
        action={
          <Button variant="primary" icon="plus" onClick={openCreate} disabled={campaigns.length === 0}>
            New pledge
          </Button>
        }
      />

      <PledgesFilters
        value={filters}
        campaigns={campaigns}
        onChange={(v) => {
          setFilters(v);
          setOffset(0);
        }}
      />

      <PledgesStatsBar
        total={total}
        active={counts.active}
        fulfilled={counts.fulfilled}
        totalAmount={totalAmount}
      />

      <PledgesTable
        rows={visible}
        loading={isLoading}
        pagination={{ total, offset, limit: PAGE_SIZE, onChange: setOffset }}
        membersById={membersById}
        campaignsById={campaignsById}
        handlers={{
          onEdit: askEdit,
          onDelete: askDelete,
          onOpenCampaign: (id) => router.push(`/${tenantSlug}/admin/campaigns/${id}`),
        }}
      />
    </div>
  );
}
