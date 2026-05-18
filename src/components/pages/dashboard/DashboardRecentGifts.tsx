"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Amount,
	Avatar,
	Card,
	Pressable,
	SectionTitle,
	TypeBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { nstr } from "@/lib/api/coerce";
import dayjs from "@/lib/dayjs";
import { cn } from "@/lib/utils";

type Transaction = components["schemas"]["TransactionResponseDto"];
type Member = components["schemas"]["MemberResponseDto"];
type Campaign = components["schemas"]["CampaignResponseDto"];

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
		return `Today · ${d.format("h:mma")}`;
	}
	if (hours < 48) {
		return "Yesterday";
	}
	if (hours < 24 * 7) {
		return `${Math.floor(hours / 24)}d ago`;
	}
	return d.format("MMM D");
};

export const DashboardRecentGifts = ({
	transactions,
	membersById,
	campaignsById,
	loading,
	tenantSlug,
}: {
	transactions: Transaction[];
	membersById: Record<string, Member>;
	campaignsById: Record<string, Campaign>;
	loading?: boolean;
	tenantSlug: string;
}) => {
	const router = useRouter();
	const recent = transactions.slice(0, 8);

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

	return (
		<Card>
			<SectionTitle
				title="Recent gifts"
				action={
					<Link
						href={`/${tenantSlug}/admin/transactions`}
						className="text-sm font-medium text-primary hover:underline"
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
				<ul className="divide-y divide-border">
					{recent.map((t) => {
						const memberId = nstr(t.memberId);
						const member = memberId ? membersById[memberId] : null;
						const campaignId = nstr(t.campaignId);
						const campaign = campaignId ? campaignsById[campaignId] : undefined;
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
							<li key={t.id}>
								<Pressable
									onClick={() =>
										router.push(`/${tenantSlug}/admin/transactions/${t.id}`)
									}
									className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted/60"
								>
									{isAnon ? (
										<div className="grid size-8 place-items-center rounded-full bg-secondary text-xs text-muted-foreground">
											?
										</div>
									) : (
										<Avatar name={name} size={32} />
									)}
									<div className="min-w-0">
										<div className="flex items-baseline gap-2">
											{!isAnon && memberId ? (
												<Link
													href={`/${tenantSlug}/admin/members/${memberId}`}
													onClick={(e) => e.stopPropagation()}
													className="truncate text-sm font-medium text-foreground hover:underline"
												>
													{name}
												</Link>
											) : (
												<span
													className={cn(
														"truncate text-sm font-medium",
														isAnon
															? "italic text-muted-foreground"
															: "text-foreground",
													)}
												>
													{name}
												</span>
											)}
											<TypeBadge type={typeLabel} />
										</div>
										<div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
											<span>{relativeDate(t.date)}</span>
											<span aria-hidden>·</span>
											{campaign ? (
												<Link
													href={`/${tenantSlug}/admin/campaigns/${campaign.id}`}
													onClick={(e) => e.stopPropagation()}
													className="truncate hover:underline"
												>
													{campaign.title}
												</Link>
											) : (
												<span className="italic text-amber-600">
													No campaign
												</span>
											)}
										</div>
									</div>
									<Amount value={t.amount} />
								</Pressable>
							</li>
						);
					})}
				</ul>
			)}
		</Card>
	);
};
