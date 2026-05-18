"use client";

import Link from "next/link";
import { Card, Icon } from "@/components/primitives";
import { formatCompact } from "@/lib/format-currency";

export const UnattributedCallout = ({
	anonymousCount,
	anonymousTotal,
	noCampaignCount,
	noCampaignTotal,
	tenantSlug,
}: {
	anonymousCount: number;
	anonymousTotal: number;
	noCampaignCount: number;
	noCampaignTotal: number;
	tenantSlug: string;
}) => {
	const hasAnon = anonymousCount > 0;
	const hasNoCampaign = noCampaignCount > 0;

	if (!hasAnon && !hasNoCampaign) {
		return null;
	}

	return (
		<div className="mb-6 grid gap-3 md:grid-cols-2">
			{hasAnon && (
				<Card className="border border-amber-500/30 bg-amber-500/5">
					<div className="flex items-start gap-3">
						<div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
							<Icon name="triangleAlert" size={18} />
						</div>
						<div className="flex-1">
							<div className="text-sm font-semibold text-foreground">
								{anonymousCount} anonymous{" "}
								{anonymousCount === 1 ? "gift" : "gifts"} this week
							</div>
							<div className="text-xs text-muted-foreground">
								{formatCompact(anonymousTotal)} not attributed to a member — tag
								to keep contribution statements complete.
							</div>
							<Link
								href={`/${tenantSlug}/admin/transactions?memberId=null`}
								className="mt-1.5 inline-block text-xs font-semibold text-primary hover:underline"
							>
								Review →
							</Link>
						</div>
					</div>
				</Card>
			)}
			{hasNoCampaign && (
				<Card className="border border-amber-500/30 bg-amber-500/5">
					<div className="flex items-start gap-3">
						<div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600">
							<Icon name="triangleAlert" size={18} />
						</div>
						<div className="flex-1">
							<div className="text-sm font-semibold text-foreground">
								{noCampaignCount} {noCampaignCount === 1 ? "gift" : "gifts"}{" "}
								with no campaign
							</div>
							<div className="text-xs text-muted-foreground">
								{formatCompact(noCampaignTotal)} not linked to a campaign —
								limits goal tracking.
							</div>
							<Link
								href={`/${tenantSlug}/admin/transactions?campaignId=null`}
								className="mt-1.5 inline-block text-xs font-semibold text-primary hover:underline"
							>
								Review →
							</Link>
						</div>
					</div>
				</Card>
			)}
		</div>
	);
};
