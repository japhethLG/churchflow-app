"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/primitives";
import { usePledges } from "@/lib/api/pledges";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMyMembership } from "@/lib/api/members";
import { useTenant } from "@/lib/api/tenants";
import { MemberPledgesTable } from "./MemberPledgesTable";

const fmtCurrency = (v: number | string): string =>
  Number(v).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const MemberMyPledgesPage = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const tenantQ = useTenant(tenantSlug);
  const currency = tenantQ.data?.currency ?? "USD";
  const currencySymbol =
    currency === "USD"
      ? "$"
      : currency === "EUR"
        ? "€"
        : currency === "GBP"
          ? "£"
          : currency;

  const memberQ = useMyMembership(tenantSlug);
  const memberId = memberQ.data?.id;

  const pledgesQ = usePledges(tenantSlug, { memberId }, Boolean(memberId));
  const pledges = pledgesQ.data?.items ?? [];

  const campaignsQ = useCampaigns(tenantSlug);
  const campaignMap = Object.fromEntries(
    (campaignsQ.data?.items ?? []).map((c) => [c.id, c]),
  );

  const activePledges = pledges.filter((p) => p.status === "ACTIVE");
  const totalActive = activePledges.reduce(
    (s, p) => s + Number(p.pledgedAmount),
    0,
  );

  const loading =
    pledgesQ.isLoading || memberQ.isLoading || campaignsQ.isLoading;

  return (
    <div className="h-full overflow-auto">
      <PageHeader
        overline="My pledges"
        title="Your pledges"
        subtitle="Track your commitments to church campaigns."
      />

      {!loading && pledges.length > 0 && (
        <div className="flex gap-10 px-6 pb-6">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Active pledges
            </div>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {activePledges.length}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Total pledged (active)
            </div>
            <div className="text-2xl font-semibold tracking-tight tabular-nums">
              {currencySymbol}
              {fmtCurrency(totalActive)}
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-10">
        <MemberPledgesTable
          rows={pledges}
          loading={loading}
          campaignMap={campaignMap}
          currencySymbol={currencySymbol}
        />
      </div>
    </div>
  );
};
