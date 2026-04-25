"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/primitives";
import { usePledges } from "@/lib/api/pledges";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMyMembership } from "@/lib/api/members";
import { useTenant } from "@/lib/api/tenants";
import { MemberPledgesTable } from "@/components/pages/member-pledges/MemberPledgesTable";
import { SANCTUARY as S } from "@/lib/design/tokens";

const fmtCurrency = (v: number | string): string  => {
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const tenantQ = useTenant(tenantSlug);
  const currency = tenantQ.data?.currency ?? "USD";
  const currencySymbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency;

  const memberQ = useMyMembership(tenantSlug);
  const memberId = memberQ.data?.id;

  const pledgesQ = usePledges(tenantSlug, { memberId }, Boolean(memberId));
  const pledges = pledgesQ.data?.items ?? [];

  const campaignsQ = useCampaigns(tenantSlug);
  const campaignMap = Object.fromEntries(
    (campaignsQ.data?.items ?? []).map((c) => [c.id, c])
  );

  const activePledges = pledges.filter((p) => p.status === "ACTIVE");
  const totalActive = activePledges.reduce((s, p) => s + Number(p.pledgedAmount), 0);

  const loading = pledgesQ.isLoading || memberQ.isLoading || campaignsQ.isLoading;

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="My pledges"
        title="Your pledges"
        subtitle="Track your commitments to church campaigns."
      />

      {!loading && pledges.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 40,
            padding: "0 24px 24px",
          }}
        >
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.onSurfaceMuted, marginBottom: 6 }}>
              Active pledges
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
              {activePledges.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: S.onSurfaceMuted, marginBottom: 6 }}>
              Total pledged (active)
            </div>
            <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
              {currencySymbol}{fmtCurrency(totalActive)}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "0 24px 40px" }}>
        <MemberPledgesTable
          rows={pledges}
          loading={loading}
          campaignMap={campaignMap}
          currencySymbol={currencySymbol}
        />
      </div>
    </div>
  );
}
