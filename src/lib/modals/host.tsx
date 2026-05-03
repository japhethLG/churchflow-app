"use client";

import type { ComponentType } from "react";
import type { ModalBaseProps, ModalName } from "./registry";
import { useModalStore } from "./store";
// Importing the modals barrel loads every modal's `declare module`
// augmentation so ModalPropsMap is fully populated here.
import "@/components/modals";
import { AddCampaignItemModal } from "@/components/modals/add-campaign-item";
import { AddMemberModal } from "@/components/modals/add-member";
import { CancelInvitationModal } from "@/components/modals/cancel-invitation";
import { ConfirmCancelCampaignModal } from "@/components/modals/confirm-cancel-campaign";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { ConfirmDeleteCampaignModal } from "@/components/modals/confirm-delete-campaign";
import { ConfirmDeleteCampaignItemModal } from "@/components/modals/confirm-delete-campaign-item";
import { ConfirmDeleteMemberModal } from "@/components/modals/confirm-delete-member";
import { ConfirmDeletePledgeModal } from "@/components/modals/confirm-delete-pledge";
import { ConfirmDeleteTenantModal } from "@/components/modals/confirm-delete-tenant";
import { ConfirmDeleteTransactionModal } from "@/components/modals/confirm-delete-transaction";
import { ConfirmRestoreTenantModal } from "@/components/modals/confirm-restore-tenant";
import { ConfirmToggleSuperAdminModal } from "@/components/modals/confirm-toggle-super-admin";
import { CreatePledgeModal } from "@/components/modals/create-pledge";
import { EditCampaignItemModal } from "@/components/modals/edit-campaign-item";
import { EditMemberModal } from "@/components/modals/edit-member";
import { EditPledgeModal } from "@/components/modals/edit-pledge";
import { EditTenantModal } from "@/components/modals/edit-tenant";
import { InviteAdminGlobalModal } from "@/components/modals/invite-admin-global";
import { InviteMemberModal } from "@/components/modals/invite-member";
import { InviteTenantAdminModal } from "@/components/modals/invite-tenant-admin";
import { MemberPledgeModal } from "@/components/modals/member-pledge";
import { MergeMemberModal } from "@/components/modals/merge-member";
import { RecordGiftModal } from "@/components/modals/record-gift";
import { RenameTenantSlugModal } from "@/components/modals/rename-tenant-slug";

type AnyModal = ComponentType<ModalBaseProps & Record<string, unknown>>;

const registry: Partial<Record<ModalName, AnyModal>> = {
	"confirm-delete": ConfirmDeleteModal as AnyModal,
	"edit-tenant": EditTenantModal as AnyModal,
	"rename-tenant-slug": RenameTenantSlugModal as AnyModal,
	"confirm-delete-tenant": ConfirmDeleteTenantModal as AnyModal,
	"confirm-restore-tenant": ConfirmRestoreTenantModal as AnyModal,
	"invite-tenant-admin": InviteTenantAdminModal as AnyModal,
	"invite-admin-global": InviteAdminGlobalModal as AnyModal,
	"confirm-toggle-super-admin": ConfirmToggleSuperAdminModal as AnyModal,
	"add-member": AddMemberModal as AnyModal,
	"edit-member": EditMemberModal as AnyModal,
	"confirm-delete-member": ConfirmDeleteMemberModal as AnyModal,
	"invite-member": InviteMemberModal as AnyModal,
	"merge-member": MergeMemberModal as AnyModal,
	"confirm-delete-campaign": ConfirmDeleteCampaignModal as AnyModal,
	"confirm-cancel-campaign": ConfirmCancelCampaignModal as AnyModal,
	"add-campaign-item": AddCampaignItemModal as AnyModal,
	"edit-campaign-item": EditCampaignItemModal as AnyModal,
	"confirm-delete-campaign-item": ConfirmDeleteCampaignItemModal as AnyModal,
	"create-pledge": CreatePledgeModal as AnyModal,
	"edit-pledge": EditPledgeModal as AnyModal,
	"confirm-delete-pledge": ConfirmDeletePledgeModal as AnyModal,
	"record-gift": RecordGiftModal as AnyModal,
	"confirm-delete-transaction": ConfirmDeleteTransactionModal as AnyModal,
	"member-pledge": MemberPledgeModal as AnyModal,
	"cancel-invitation": CancelInvitationModal as AnyModal,
};

export const ModalHost = () => {
	const { active, close } = useModalStore();
	if (!active) {
		return null;
	}
	const { name, props } = active as {
		name: ModalName;
		props: Record<string, unknown>;
	};
	const Comp = registry[name];
	if (!Comp) {
		return null;
	}
	return <Comp {...props} onClose={close} />;
};
