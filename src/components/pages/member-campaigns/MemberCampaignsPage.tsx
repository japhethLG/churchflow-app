"use client";

import { useParams } from "next/navigation";
import {
  PageHeader,
  Card,
  Badge,
  StatusBadge,
  Button,
} from "@/components/primitives";
import { useCampaigns, useCampaignProgress } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";
import { useMyMembership } from "@/lib/api/members";
import { useModalStore } from "@/lib/modals/store";
import { nstr } from "@/lib/api/coerce";
import type { components } from "@/lib/api";
import type { MemberPledgeProps } from "@/components/modals/member-pledge";
import { cn } from "@/lib/utils";
import { formatCompact } from "@/lib/format-currency";

type Campaign = components["schemas"]["CampaignResponseDto"];

const STATUS_MAP: Record<
  Campaign["status"],
  "Active" | "Upcoming" | "Completed" | "Cancelled"
> = {
  DRAFT: "Upcoming",
  ACTIVE: "Active",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};


export const MemberCampaignsPage = () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const open = useModalStore((s) => s.open);


  const memberQ = useMyMembership(tenantSlug);
  const memberId = memberQ.data?.id;

  const campaignsQ = useCampaigns(tenantSlug);
  const campaigns = campaignsQ.data?.items ?? [];

  const pledgesQ = usePledges(tenantSlug, { memberId }, Boolean(memberId));
  const pledges = pledgesQ.data?.items ?? [];

  const pledgeByCampaign: Record<string, typeof pledges> = {};
  for (const p of pledges) {
    if (!pledgeByCampaign[p.campaignId]) pledgeByCampaign[p.campaignId] = [];
    pledgeByCampaign[p.campaignId].push(p);
  }

  const activeCampaigns = campaigns.filter(
    (c) => c.status === "ACTIVE" || c.status === "DRAFT",
  );
  const pastCampaigns = campaigns.filter(
    (c) => c.status === "COMPLETED" || c.status === "CANCELLED",
  );

  const loading = campaignsQ.isLoading;

  return (
    <div className="h-full overflow-auto pr-2">
      <PageHeader
        overline="Campaigns"
        title="Church campaigns"
        subtitle="Browse active fundraising campaigns, view progress, and make pledges."
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="mb-3 h-5 w-[180px] rounded bg-secondary" />
              <div className="mb-4 h-3.5 w-[260px] rounded bg-secondary" />
              <div className="mb-2 h-1.5 rounded bg-secondary" />
              <div className="h-3 w-[100px] rounded bg-secondary" />
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <div className="mb-3 text-5xl leading-none">🎯</div>
            <div className="mb-1 text-base font-medium text-foreground">
              No campaigns yet
            </div>
            <div className="text-sm text-muted-foreground">
              Your church hasn&apos;t started any campaigns. Check back later!
            </div>
          </div>
        </Card>
      ) : (
        <>
          {activeCampaigns.length > 0 && (
            <>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Active campaigns
              </div>
              <div className="mb-8 grid grid-cols-2 gap-4">
                {activeCampaigns.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    myPledges={pledgeByCampaign[c.id] ?? []}
                    tenantSlug={tenantSlug}
                    memberId={memberId}
                    onPledge={open}
                  />
                ))}
              </div>
            </>
          )}

          {pastCampaigns.length > 0 && (
            <>
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Past campaigns
              </div>
              <div className="mb-8 grid grid-cols-2 gap-4">
                {pastCampaigns.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    myPledges={pledgeByCampaign[c.id] ?? []}
                    tenantSlug={tenantSlug}
                    memberId={memberId}
                    onPledge={open}
                    past
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

const CampaignCard = ({
  campaign: c,
  myPledges,
  tenantSlug,
  memberId,
  onPledge,
  past,
}: {
  campaign: Campaign;
  myPledges: components["schemas"]["PledgeResponseDto"][];
  tenantSlug: string;
  memberId?: string;
  onPledge: (name: "member-pledge", props: MemberPledgeProps) => void;
  past?: boolean;
}) => {
  const progressQ = useCampaignProgress(tenantSlug, c.id, Boolean(c.id));
  const progress = progressQ.data;
  const goal = Number(progress?.goalAmount ?? 0);
  const raised = Number(progress?.raisedAmount ?? 0);
  const pledged = Number(progress?.pledgedAmount ?? 0);
  const pct = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;

  const items = progress?.items ?? [];
  const description = nstr(c.description);
  const deadline = nstr(c.deadline);

  const myPledgeTotal = myPledges.reduce(
    (s, p) => s + Number(p.pledgedAmount),
    0,
  );
  const myActivePledges = myPledges.filter((p) => p.status === "ACTIVE");

  return (
    <Card padding={24} className="flex h-full flex-col">
      <div className="mb-1.5 flex items-center gap-2">
        <h3 className="min-w-0 flex-1 truncate text-[17px] font-semibold tracking-tight text-foreground">
          {c.title}
        </h3>
        <StatusBadge status={STATUS_MAP[c.status]} />
      </div>

      <div className="mb-3.5 line-clamp-2 min-h-[2.8em] text-[13px] leading-snug text-secondary-foreground">
        {description || "\u00A0"}
      </div>

      <div className="mb-3">
        <div className="mb-2 h-2 overflow-hidden rounded bg-muted">
          <div
            className={cn(
              "h-full rounded transition-[width] duration-500 ease-out",
              past ? "bg-muted-foreground" : "bg-linear-to-r from-ring to-primary",
            )}
            style={{ width: goal > 0 ? `${pct}%` : "0%" }}
          />
        </div>
        <div className="flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>
            {formatCompact(raised)} raised
            {pledged > 0 &&
              ` · ${formatCompact(pledged)} pledged`}
          </span>
          <span>
            {goal > 0
              ? `Goal: ${formatCompact(goal)}`
              : "No goal set"}
          </span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="mb-3.5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Campaign items
          </div>
          <div className="flex flex-col gap-1.5">
            {items.map((item) => {
              const itemPct =
                Number(item.targetAmount) > 0
                  ? Math.min(
                      (Number(item.raisedAmount) / Number(item.targetAmount)) *
                        100,
                      100,
                    )
                  : 0;
              return (
                <div key={item.itemId} className="flex items-center gap-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="font-medium text-foreground">
                        {item.title}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {`${item.raisedAmount} / ${formatCompact(Number(item.targetAmount))}`}
                      </span>
                    </div>
                    <div className="h-1 rounded-sm bg-muted">
                      <div
                        className="h-full rounded-sm bg-primary transition-[width] duration-500"
                        style={{ width: `${itemPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1" />

      <div className="-mx-6 mb-3.5 h-px bg-secondary" />

      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {myActivePledges.length > 0 ? (
          <Badge color="indigo">
          Your pledge: {formatCompact(myPledgeTotal)}
          </Badge>
        ) : (
          !past && <Badge color="neutral">No pledge yet</Badge>
        )}
        {deadline && (
          <Badge color="gray">
            {past ? "Ended" : "Ends"}{" "}
            {new Date(deadline).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Badge>
        )}
        {progress && (
          <Badge color="gray">
            {progress.pledgeCount} pledge
            {progress.pledgeCount !== 1 ? "s" : ""}
          </Badge>
        )}
      </div>

      {!past && memberId && (
        <Button
          className="w-full"
          onClick={() =>
            onPledge("member-pledge", {
              tenantSlug,
              campaignId: c.id,
              campaignTitle: c.title,
              memberId,
              items: items.map((i) => ({
                id: i.itemId,
                tenantId: c.tenantId,
                campaignId: c.id,
                title: i.title,
                targetAmount: i.targetAmount,
                sortOrder: 0,
                createdAt: c.createdAt,
                updatedAt: c.updatedAt,
              })),
            })
          }
        >
          {myActivePledges.length > 0 ? "Add another pledge" : "Make a pledge"}
        </Button>
      )}
    </Card>
  );
};
