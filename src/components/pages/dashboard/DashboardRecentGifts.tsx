"use client";

import Link from "next/link";
import {
	Amount,
	Avatar,
	Card,
	SectionTitle,
	TypeBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { nstr } from "@/lib/api/coerce";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

type Transaction = components["schemas"]["TransactionResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];

const TYPE_UI: Record<Transaction["type"], string> = {
	TITHE: "Tithe",
	OFFERING: "Offering",
	MISSION_GIVING: "Mission",
	FIRST_FRUIT: "First Fruit",
	COMMITMENT: "Commitment",
	DONATION: "Donation",
	OTHER: "Other",
};

const relativeDate = (iso: string): string => {
	const d = dayjs(iso);
	const now = dayjs();
	const hours = now.diff(d, "hour", true);

	if (hours < 24) {
		return `Today, ${d.format("h:mma")}`;
	}
	if (hours < 48) return "Yesterday";
	if (hours < 24 * 7) return `${Math.floor(hours / 24)} days ago`;
	return d.format("MMM D");
};

export const DashboardRecentGifts = ({
	transactions,
	membersById,
	loading,
	tenantSlug,
}: {
	transactions: Transaction[];
	membersById: Record<string, Member>;
	loading?: boolean;
	tenantSlug: string;
}) => {
	if (loading) {
		return (
			<Card>
				<SectionTitle title="Recent gifts" />
				{[0, 1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 px-2 py-2.5"
					>
						<div className="size-8 rounded-full bg-secondary" />
						<div>
							<div className="mb-1 h-3.5 w-[120px] rounded bg-secondary" />
							<div className="h-2.5 w-20 rounded bg-secondary" />
						</div>
						<div className="h-5 w-[50px] rounded-full bg-secondary" />
						<div className="h-3.5 w-[60px] rounded bg-secondary" />
					</div>
				))}
			</Card>
		);
	}

	const recent = transactions.slice(0, 6);

	return (
		<Card>
			<SectionTitle
				title="Recent gifts"
				action={
					<Link
						href={`/${tenantSlug}/admin/transactions`}
						className="text-[13px] font-medium text-primary"
					>
						View all →
					</Link>
				}
			/>
			{recent.length === 0 ? (
				<div className="py-8 text-center text-sm text-muted-foreground">
					No transactions recorded yet.
				</div>
			) : (
				recent.map((t, i) => {
					const memberId = nstr(t.memberId);
					const member = memberId ? membersById[memberId] : null;
					const isAnon = !member;
					const name = member
						? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() ||
							"Unnamed"
						: "Anonymous";
					const typeLabel = TYPE_UI[t.type] as
						| "Tithe"
						| "Offering"
						| "Mission"
						| "First Fruit"
						| "Commitment"
						| "Donation"
						| "Other";

					return (
						<div
							key={t.id}
							className={cn(
								"grid grid-cols-[36px_1fr_auto_auto] items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors duration-150",
								i === 0 ? "bg-muted" : "bg-transparent",
							)}
						>
							{isAnon ? (
								<div className="grid size-8 place-items-center rounded-full bg-secondary text-xs text-muted-foreground">
									?
								</div>
							) : (
								<Avatar name={name} size={32} />
							)}
							<div>
								<div
									className={cn(
										"text-[13px] font-medium",
										isAnon ? "italic text-muted-foreground" : "text-foreground",
									)}
								>
									{name}
								</div>
								<div className="text-[11px] text-muted-foreground">
									{relativeDate(t.date)}
								</div>
							</div>
							<TypeBadge type={typeLabel} />
							<Amount value={t.amount} />
						</div>
					);
				})
			)}
		</Card>
	);
};
