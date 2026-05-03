"use client";

import Link from "next/link";
import { Amount, Card, SectionTitle } from "@/components/primitives";
import { TypeBadge } from "@/components/primitives/Badge";
import type { components } from "@/lib/api";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

type Transaction = components["schemas"]["TransactionResponseDto"];

const TYPE_LABEL: Record<string, string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

const fmtDate = (iso: string): string => {
	return dayjs(iso).format("MMM D");
};

export const MemberRecentGiving = ({
	transactions,
	loading,
	tenantSlug,
}: {
	transactions: Transaction[];
	loading?: boolean;
	tenantSlug: string;
}) => {
	if (loading) {
		return (
			<Card>
				<SectionTitle title="Recent giving" />
				{[0, 1, 2, 3].map((i) => (
					<div
						key={i}
						className="grid grid-cols-[70px_110px_1fr_auto] items-center gap-4 px-3 py-3.5"
					>
						<div className="h-3.5 w-[50px] rounded bg-secondary" />
						<div className="h-5 w-20 rounded-full bg-secondary" />
						<div className="h-3.5 w-[100px] rounded bg-secondary" />
						<div className="h-3.5 w-[60px] rounded bg-secondary" />
					</div>
				))}
			</Card>
		);
	}

	const recent = [...transactions]
		.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
		.slice(0, 5);

	return (
		<Card>
			<SectionTitle
				title="Recent giving"
				action={
					<Link
						href={`/${tenantSlug}/member/my-transactions`}
						className="text-sm font-medium text-primary"
					>
						View all my giving →
					</Link>
				}
			/>
			{recent.length === 0 ? (
				<div className="py-8 text-center text-sm text-muted-foreground">
					No giving history yet.
				</div>
			) : (
				recent.map((t, i) => (
					<div
						key={t.id}
						className={cn(
							"grid grid-cols-[70px_110px_1fr_auto] items-center gap-4 px-3 py-3.5",
							i === 0 ? "rounded-[10px] bg-muted" : "",
						)}
					>
						<div className="text-sm tabular-nums text-muted-foreground">
							{fmtDate(t.date)}
						</div>
						<TypeBadge type={(TYPE_LABEL[t.type] ?? t.type) as "Tithe"} />
						<div className="text-sm text-muted-foreground">
							{TYPE_LABEL[t.type] ?? t.type}
						</div>
						<Amount value={t.amount} />
					</div>
				))
			)}
		</Card>
	);
};
