"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
	Button,
	EntityRestoreBanner,
	PageActionsMenu,
	PageHeader,
	SegmentedControl,
} from "@/components/primitives";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMember } from "@/lib/api/members";
import { openModal } from "@/lib/modals/store";
import { MemberOverviewTab } from "./MemberOverviewTab";
import { MemberPledgesTab } from "./MemberPledgesTab";
import { MemberTransactionsTab } from "./MemberTransactionsTab";

type Tab = "overview" | "pledges" | "transactions";

const TABS = [
	{ value: "overview", label: "Overview" },
	{ value: "pledges", label: "Pledges" },
	{ value: "transactions", label: "Transactions" },
];

export const MemberDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
	const [tab, setTab] = useState<Tab>("overview");

	const {
		data: member,
		isLoading,
		error,
	} = useMember(tenantSlug, id, {
		includeDeleted: true,
	});

	// Used for Record-pledge CTA — needs at least one active campaign to seed
	// the modal. Fetched lazily here because it's also used inside Overview.
	const campaignsQ = useCampaigns(tenantSlug);
	const activeCampaign = (campaignsQ.data?.items ?? []).find(
		(c) => c.status === "ACTIVE",
	);

	if (isLoading) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					back={{ href: `/${tenantSlug}/admin/members`, label: "Members" }}
					title="Loading…"
					subtitle="Fetching member details…"
				/>
				<div className="overflow-auto flex-1 px-8 pb-8 flex flex-col gap-4">
					<div className="h-60 rounded-2xl bg-secondary animate-pulse" />
				</div>
			</div>
		);
	}

	if (error || !member) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					back={{ href: `/${tenantSlug}/admin/members`, label: "Members" }}
					title="Not found"
					subtitle="This member may have been removed."
				/>
				<div className="overflow-auto flex-1 px-8 pb-8 text-center text-muted-foreground flex flex-col items-center justify-center">
					<p className="mb-4 text-base font-medium text-foreground">
						Member not found
					</p>
					<Button
						role="secondary"
						onClick={() => router.push(`/${tenantSlug}/admin/members`)}
					>
						Back to members
					</Button>
				</div>
			</div>
		);
	}

	const fullName = `${member.firstName} ${member.lastName}`.trim();
	const isDeleted = Boolean(member.deletedAt);

	const openRecordGift = () =>
		openModal("record-gift", { tenantSlug, defaultMemberId: member.id });
	const openRecordPledge = () => {
		if (!activeCampaign) {
			return;
		}
		openModal("create-pledge", {
			tenantSlug,
			campaignId: activeCampaign.id,
			campaignTitle: activeCampaign.title,
			items: [],
			defaultMemberId: member.id,
		});
	};

	const action = !isDeleted ? (
		<>
			<Button role="primary" icon="plus" onClick={openRecordGift}>
				Record gift
			</Button>
			<Button
				role="secondary"
				icon="book"
				onClick={openRecordPledge}
				disabled={!activeCampaign}
			>
				Record pledge
			</Button>
			<PageActionsMenu
				actions={[
					{
						label: "Edit member",
						onClick: () => openModal("edit-member", { tenantSlug, member }),
					},
					...(!member.userId
						? [
								{
									label: "Send sign-in invite",
									onClick: () =>
										openModal("invite-member", {
											tenantId: tenantSlug,
											claimMemberId: member.id,
											claimMemberName: fullName,
											defaultEmail:
												typeof member.email === "string"
													? member.email
													: undefined,
										}),
								},
							]
						: []),
					{
						label: "Merge with another member",
						onClick: () =>
							openModal("merge-member", { tenantSlug, keep: member }),
					},
					{
						label: "Remove member",
						onClick: () =>
							openModal("confirm-delete-member", {
								tenantSlug,
								memberId: member.id,
								memberName: fullName,
								onDeleted: () => router.push(`/${tenantSlug}/admin/members`),
							}),
						destructive: true,
						separatorBefore: true,
					},
				]}
			/>
		</>
	) : undefined;

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				back={{ href: `/${tenantSlug}/admin/members`, label: "Members" }}
				title={fullName}
				subtitle="Giving relationship, pledges, and transactions."
				action={action}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				{isDeleted && (
					<EntityRestoreBanner
						className="mb-4"
						entityLabel="Member"
						deletedAt={member.deletedAt}
						onRestore={() =>
							openModal("confirm-restore-member", {
								tenantId: tenantSlug,
								memberId: member.id,
								memberName: fullName,
							})
						}
					/>
				)}

				<div className="mb-6">
					<SegmentedControl
						options={TABS}
						value={tab}
						onChange={(v) => setTab(v as Tab)}
					/>
				</div>

				{tab === "overview" && (
					<MemberOverviewTab member={member} tenantSlug={tenantSlug} />
				)}
				{tab === "pledges" && (
					<MemberPledgesTab member={member} tenantSlug={tenantSlug} />
				)}
				{tab === "transactions" && <MemberTransactionsTab member={member} />}
			</div>
		</div>
	);
};
