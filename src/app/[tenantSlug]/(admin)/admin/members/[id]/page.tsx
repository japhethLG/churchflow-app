"use client";

import { useParams, useRouter } from "next/navigation";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Button, PageHeader } from "@/components/primitives";
import {
  MemberInfoCard,
  MemberRecentGiving,
  MemberPledges,
} from "@/components/pages/members";
import { useMember } from "@/lib/api/members";
import { openModal } from "@/lib/modals/store";

export default () => {
  const router = useRouter();
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const { data: member, isLoading, error } = useMember(tenantSlug, id);

  if (isLoading) {
    return (
      <div style={{ height: "100%", overflow: "auto" }}>
        <div style={{ height: 60, background: S.surfaceContainer, borderRadius: 12, marginBottom: 24 }} />
        <div style={{ height: 240, background: S.surfaceContainer, borderRadius: 16 }} />
      </div>
    );
  }

  if (error || !member) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: S.onSurfaceMuted }}>
        <p style={{ fontSize: 16, color: S.onSurface }}>Member not found</p>
        <p style={{ fontSize: 13 }}>This member may have been removed.</p>
        <div style={{ marginTop: 16 }}>
          <Button variant="secondary" onClick={() => router.push(`/${tenantSlug}/admin/members`)}>
            Back to members
          </Button>
        </div>
      </div>
    );
  }

  const fullName = `${member.firstName} ${member.lastName}`.trim();

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="Directory / Members"
        title={fullName}
        subtitle="Member profile, giving history, and pledges."
        action={
          <>
            <Button variant="secondary" onClick={() => router.push(`/${tenantSlug}/admin/members`)}>
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
                    defaultEmail: typeof member.email === "string" ? member.email : undefined,
                  })
                }
              >
                Send sign-in invite
              </Button>
            )}
            <Button
              variant="secondary"
              icon="link"
              onClick={() => openModal("merge-member", { tenantSlug, keep: member })}
            >
              Merge
            </Button>
            <Button variant="secondary" icon="edit" onClick={() => openModal("edit-member", { tenantSlug, member })}>
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

      <div style={{ display: "grid", gap: 16 }}>
        <MemberInfoCard member={member} />
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, alignItems: "start" }}>
          <MemberRecentGiving tenantSlug={tenantSlug} memberId={member.id} />
          <MemberPledges tenantSlug={tenantSlug} memberId={member.id} />
        </div>
      </div>
    </div>
  );
}
