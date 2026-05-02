"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import { useMember } from "@/lib/api/members";
import { openModal } from "@/lib/modals/store";
import { MemberInfoCard } from "./MemberInfoCard";
import { MemberPledges } from "./MemberPledges";
import { MemberRecentGiving } from "./MemberRecentGiving";

export const MemberDetailPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
	const { data: member, isLoading, error } = useMember(tenantSlug, id);

	if (isLoading) {
		return (
			<div className="p-6">
				<div className="mb-6 h-[60px] rounded-xl bg-secondary" />
				<div className="h-60 rounded-2xl bg-secondary" />
			</div>
		);
	}

	if (error || !member) {
		return (
			<div className="bg-background px-10 py-10 text-center text-muted-foreground">
				<p className="mb-1 text-base font-medium text-foreground">
					Member not found
				</p>
				<p className="text-sm">This member may have been removed.</p>
				<div className="mt-4">
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

	return (
		<div className="h-full overflow-auto">
			<PageHeader
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
							onClick={() => openModal("edit-member", { tenantSlug, member })}
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
									onDeleted: () => router.push(`/${tenantSlug}/admin/members`),
								})
							}
						>
							Remove
						</Button>
					</>
				}
			/>

			<div className="grid gap-4">
				<MemberInfoCard member={member} />
				<div className="grid grid-cols-[2fr_1fr] items-start gap-4">
					<MemberRecentGiving tenantSlug={tenantSlug} memberId={member.id} />
					<MemberPledges tenantSlug={tenantSlug} memberId={member.id} />
				</div>
			</div>
		</div>
	);
};
