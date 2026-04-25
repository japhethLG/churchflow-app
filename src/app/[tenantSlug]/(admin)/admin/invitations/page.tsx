"use client";

import { useParams } from "next/navigation";
import { PageHeader, Button } from "@/components/primitives";
import { useInvitations } from "@/lib/api/invitations";
import { useTenant } from "@/lib/api/tenants";
import { openModal } from "@/lib/modals/store";
import { InvitationsTable } from "@/components/pages/invitations/InvitationsTable";
import { InvitationsStatsBar } from "@/components/pages/invitations/InvitationsStatsBar";

export default () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const tenantQ = useTenant(tenantSlug);
  const tenantId = tenantQ.data?.id ?? tenantSlug;
  const invitationsQ = useInvitations(tenantSlug);
  const invitations = invitationsQ.data?.items ?? [];

  const pendingCount = invitations.filter((i) => i.status === "PENDING").length;
  const acceptedCount = invitations.filter((i) => i.status === "ACCEPTED").length;
  const cancelledCount = invitations.filter(
    (i) => i.status === "CANCELLED" || i.status === "EXPIRED"
  ).length;

  const handleInvite = () => openModal("invite-member", { tenantId: tenantSlug });
  
  const handleCancel = (inv: any) =>
    openModal("cancel-invitation", {
      tenantId: tenantSlug,
      invitationId: inv.id,
      email: inv.email,
    });

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <PageHeader
        overline="Directory"
        title="Invitations"
        subtitle="Manage member and admin access to your church account."
        action={
          <Button variant="primary" icon="plus" onClick={handleInvite}>
            Invite member
          </Button>
        }
      />

      <InvitationsStatsBar
        total={invitations.length}
        pending={pendingCount}
        accepted={acceptedCount}
        cancelled={cancelledCount}
      />

      <div style={{ padding: "0 24px 40px" }}>
        <InvitationsTable
          rows={invitations}
          loading={invitationsQ.isLoading}
          tenantId={tenantSlug}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
