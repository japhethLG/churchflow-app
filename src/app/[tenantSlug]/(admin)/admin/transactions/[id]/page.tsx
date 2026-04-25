"use client";

import { useParams, useRouter } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import {
  Amount,
  Avatar,
  Button,
  Card,
  PageHeader,
  SectionTitle,
  TypeBadge,
} from "@/components/primitives";
import { useCampaign } from "@/lib/api/campaigns";
import { useMember } from "@/lib/api/members";
import { usePledge } from "@/lib/api/pledges";
import { useTransaction } from "@/lib/api/transactions";
import { nstr, type components } from "@/lib/api";
import { openModal } from "@/lib/modals/store";

type Tx = components["schemas"]["TransactionResponseDto"];

const TYPE_BADGE_LABEL: Record<Tx["type"], "Tithe" | "Offering" | "Mission" | "First Fruit" | "Commitment" | "Donation" | "Other"> = {
  TITHE: "Tithe",
  OFFERING: "Offering",
  MISSION_GIVING: "Mission",
  FIRST_FRUIT: "First Fruit",
  COMMITMENT: "Commitment",
  DONATION: "Donation",
  OTHER: "Other",
};

const METHOD_LABEL: Record<Tx["paymentMethod"], string> = {
  CASH: "Cash",
  CHECK: "Check",
  BANK_TRANSFER: "Bank transfer",
  ONLINE: "Online",
  MOBILE_MONEY: "Mobile money",
  OTHER: "Other",
};

export default () => {
  const router = useRouter();
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const { data: tx, isLoading, error } = useTransaction(tenantSlug, id);

  const memberId = nstr(tx?.memberId);
  const campaignId = nstr(tx?.campaignId);
  const pledgeId = nstr(tx?.pledgeId);
  const campaignItemId = nstr(tx?.campaignItemId);

  const memberQ = useMember(tenantSlug, memberId ?? "", Boolean(memberId));
  const campaignQ = useCampaign(tenantSlug, campaignId ?? "", Boolean(campaignId));
  const pledgeQ = usePledge(tenantSlug, pledgeId ?? "", Boolean(pledgeId));

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <div style={{ height: 60, background: S.surfaceContainer, borderRadius: 12, marginBottom: 24 }} />
        <div style={{ height: 240, background: S.surfaceContainer, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: S.onSurfaceMuted }}>
        <p style={{ fontSize: 16, color: S.onSurface }}>Transaction not found</p>
        <p style={{ fontSize: 13 }}>It may have been deleted.</p>
        <div style={{ marginTop: 16 }}>
          <Button variant="secondary" onClick={() => router.push(`/${tenantSlug}/admin/transactions`)}>
            Back to transactions
          </Button>
        </div>
      </div>
    );
  }

  const member = memberQ.data;
  const campaign = campaignQ.data;
  const pledge = pledgeQ.data;
  const itemTitle =
    campaignItemId && campaign?.items
      ? campaign.items.find((it) => it.id === campaignItemId)?.title ?? null
      : null;

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="Ledger / Transactions"
        title={`${tx.currency} ${Number(tx.amount).toFixed(2)}`}
        subtitle={`${TYPE_BADGE_LABEL[tx.type]} · ${new Date(tx.date).toLocaleDateString(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`}
        action={
          <>
            <Button variant="secondary" onClick={() => router.push(`/${tenantSlug}/admin/transactions`)}>
              Back
            </Button>
            <Button
              variant="tertiary"
              destructive
              icon="trash"
              onClick={() =>
                openModal("confirm-delete-transaction", {
                  tenantSlug,
                  transactionId: tx.id,
                  amountLabel: `${tx.currency} ${Number(tx.amount).toFixed(2)}`,
                  onDeleted: () => router.push(`/${tenantSlug}/admin/transactions`),
                })
              }
            >
              Delete
            </Button>
          </>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, alignItems: "start" }}>
        <Card padding={24}>
          <SectionTitle title="Details" />
          <DetailRow label="Amount" value={<Amount value={Number(tx.amount).toFixed(2)} currency={`${tx.currency} `} />} />
          <DetailRow label="Type" value={<TypeBadge type={TYPE_BADGE_LABEL[tx.type]} />} />
          <DetailRow label="Payment method" value={METHOD_LABEL[tx.paymentMethod]} />
          <DetailRow
            label="Reference #"
            value={
              nstr(tx.referenceNumber) ? (
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 13, color: S.onSurfaceMuted }}>
                  {nstr(tx.referenceNumber)}
                </span>
              ) : (
                <span style={{ color: S.onSurfaceMuted }}>—</span>
              )
            }
          />
          <DetailRow
            label="Recorded on"
            value={new Date(tx.createdAt).toLocaleString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            last
          />
          {nstr(tx.note) && (
            <>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: S.onSurfaceMuted,
                  marginTop: 16,
                  marginBottom: 6,
                }}
              >
                Note
              </div>
              <p style={{ margin: 0, fontSize: 14, color: S.onSurfaceVariant, lineHeight: 1.6 }}>
                {nstr(tx.note)}
              </p>
            </>
          )}
        </Card>

        <Card padding={24}>
          <SectionTitle title="Attribution" />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Member */}
            <div>
              <Label>Member</Label>
              {member ? (
                <button
                  type="button"
                  onClick={() => router.push(`/${tenantSlug}/admin/members/${member.id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "inherit",
                    color: S.onSurface,
                  }}
                >
                  <Avatar name={`${member.firstName} ${member.lastName}`} size={32} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>
                    {member.firstName} {member.lastName}
                  </span>
                </button>
              ) : (
                <span style={{ fontSize: 14, color: S.onSurfaceMuted, fontStyle: "italic" }}>Anonymous gift</span>
              )}
            </div>

            {/* Campaign + item */}
            <div>
              <Label>Campaign</Label>
              {campaign ? (
                <button
                  type="button"
                  onClick={() => router.push(`/${tenantSlug}/admin/campaigns/${campaign.id}`)}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    color: S.primary,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {campaign.title}
                </button>
              ) : (
                <span style={{ fontSize: 14, color: S.onSurfaceMuted }}>Not attributed</span>
              )}
              {itemTitle && (
                <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 4 }}>
                  Earmarked to <strong>{itemTitle}</strong>
                </div>
              )}
            </div>

            {/* Pledge */}
            <div>
              <Label>Pledge</Label>
              {pledge ? (
                <span style={{ fontSize: 14 }}>
                  {tx.currency} {Number(pledge.pledgedAmount).toFixed(2)} pledged · status{" "}
                  <strong>{pledge.status.toLowerCase()}</strong>
                </span>
              ) : (
                <span style={{ fontSize: 14, color: S.onSurfaceMuted }}>Unpledged</span>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const DetailRow = ({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 0",
        borderBottom: last ? "none" : `1px solid ${S.surfaceContainer}`,
        gap: 16,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: S.onSurfaceMuted,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 14, fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: S.onSurfaceMuted,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}
