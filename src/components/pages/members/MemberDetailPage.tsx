"use client";

import { useParams, useRouter } from "next/navigation";
import {
	Button,
	EntityRestoreBanner,
	PageHeader,
} from "@/components/primitives";
import { useMember } from "@/lib/api/members";
import { openModal } from "@/lib/modals/store";
import { MemberInfoCard } from "./MemberInfoCard";
import { MemberPledges } from "./MemberPledges";
import { MemberRecentGiving } from "./MemberRecentGiving";

export const MemberDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
	const {
		data: member,
		isLoading,
		error,
	} = useMember(tenantSlug, id, {
		includeDeleted: true,
	});

	if (isLoading) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					overline="Directory / Members"
					title="Loading..."
					subtitle="Fetching member details..."
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
					overline="Directory / Members"
					title="Not Found"
					subtitle="This member may have been removed."
				/>
				<div className="overflow-auto flex-1 px-8 pb-8 text-center text-muted-foreground flex flex-col items-center justify-center">
					<p className="mb-4 text-base font-medium text-foreground">
						Member not found
					</p>
					<Button
						variant="secondary"
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

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Directory / Members"
				title={fullName}
				subtitle="Member profile, giving history, and pledges."
				action={
					<>
						<Button
							variant="secondary"
							onClick={() => router.push(`/${tenantSlug}/admin/members`)}
						>
							Back
						</Button>
						{!isDeleted && (
							<>
								{!member.userId && (
									<Button
										variant="secondary"
										icon="mail"
										onClick={() =>
											openModal("invite-member", {
												tenantId: tenantSlug,
												claimMemberId: member.id,
												claimMemberName: fullName,
												defaultEmail:
													typeof member.email === "string"
														? member.email
														: undefined,
											})
										}
									>
										Send sign-in invite
									</Button>
								)}
								<Button
									variant="secondary"
									icon="link"
									onClick={() =>
										openModal("merge-member", { tenantSlug, keep: member })
									}
								>
									Merge
								</Button>
								<Button
									variant="secondary"
									icon="edit"
									onClick={() =>
										openModal("edit-member", { tenantSlug, member })
									}
								>
									Edit
								</Button>
								<Button
									variant="tertiary"
									destructive
									icon="trash"
									onClick={() =>
										openModal("confirm-delete-member", {
											tenantSlug,
											memberId: member.id,
											memberName: fullName,
											onDeleted: () =>
												router.push(`/${tenantSlug}/admin/members`),
										})
									}
								>
									Remove
								</Button>
							</>
						)}
					</>
				}
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
				<div className="grid gap-4">
					<MemberInfoCard member={member} />
					<div className="grid grid-cols-[2fr_1fr] items-start gap-4">
						<MemberRecentGiving tenantSlug={tenantSlug} memberId={member.id} />
						<MemberPledges tenantSlug={tenantSlug} memberId={member.id} />
					</div>
				</div>
			</div>
		</div>
	);
};
