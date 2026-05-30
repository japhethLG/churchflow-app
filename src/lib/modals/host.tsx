"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ModalBaseProps, ModalName } from "./registry";
import { useModalStore } from "./store";

type AnyModal = ComponentType<ModalBaseProps & Record<string, unknown>>;

// Code-split each modal into its own chunk, loaded only when first opened.
// Previously all ~30 modals (and their zod/RHF form deps) were statically
// imported here and pulled into the first authenticated navigation's bundle,
// even though most navigations open zero modals.
//
// The `declare module "@/lib/modals/registry"` augmentations that populate
// ModalPropsMap are applied by the compiler from src/** (tsconfig `include`),
// so no barrel side-effect import is needed for type safety here.
const lazyModal = (
	loader: () => Promise<Record<string, unknown>>,
	exportName: string,
): AnyModal =>
	dynamic(() => loader().then((mod) => mod[exportName] as AnyModal), {
		ssr: false,
	}) as AnyModal;

const registry: Partial<Record<ModalName, AnyModal>> = {
	"confirm-delete": lazyModal(
		() => import("@/components/modals/confirm-delete"),
		"ConfirmDeleteModal",
	),
	"edit-tenant": lazyModal(
		() => import("@/components/modals/edit-tenant"),
		"EditTenantModal",
	),
	"rename-tenant-slug": lazyModal(
		() => import("@/components/modals/rename-tenant-slug"),
		"RenameTenantSlugModal",
	),
	"confirm-delete-tenant": lazyModal(
		() => import("@/components/modals/confirm-delete-tenant"),
		"ConfirmDeleteTenantModal",
	),
	"confirm-restore-tenant": lazyModal(
		() => import("@/components/modals/confirm-restore-tenant"),
		"ConfirmRestoreTenantModal",
	),
	"confirm-restore-member": lazyModal(
		() => import("@/components/modals/confirm-restore-member"),
		"ConfirmRestoreMemberModal",
	),
	"confirm-restore-campaign": lazyModal(
		() => import("@/components/modals/confirm-restore-campaign"),
		"ConfirmRestoreCampaignModal",
	),
	"confirm-restore-campaign-item": lazyModal(
		() => import("@/components/modals/confirm-restore-campaign-item"),
		"ConfirmRestoreCampaignItemModal",
	),
	"confirm-restore-pledge": lazyModal(
		() => import("@/components/modals/confirm-restore-pledge"),
		"ConfirmRestorePledgeModal",
	),
	"confirm-restore-transaction": lazyModal(
		() => import("@/components/modals/confirm-restore-transaction"),
		"ConfirmRestoreTransactionModal",
	),
	"invite-tenant-admin": lazyModal(
		() => import("@/components/modals/invite-tenant-admin"),
		"InviteTenantAdminModal",
	),
	"invite-admin-global": lazyModal(
		() => import("@/components/modals/invite-admin-global"),
		"InviteAdminGlobalModal",
	),
	"confirm-toggle-super-admin": lazyModal(
		() => import("@/components/modals/confirm-toggle-super-admin"),
		"ConfirmToggleSuperAdminModal",
	),
	"add-member": lazyModal(
		() => import("@/components/modals/add-member"),
		"AddMemberModal",
	),
	"edit-member": lazyModal(
		() => import("@/components/modals/edit-member"),
		"EditMemberModal",
	),
	"confirm-delete-member": lazyModal(
		() => import("@/components/modals/confirm-delete-member"),
		"ConfirmDeleteMemberModal",
	),
	"invite-member": lazyModal(
		() => import("@/components/modals/invite-member"),
		"InviteMemberModal",
	),
	"merge-member": lazyModal(
		() => import("@/components/modals/merge-member"),
		"MergeMemberModal",
	),
	"confirm-delete-campaign": lazyModal(
		() => import("@/components/modals/confirm-delete-campaign"),
		"ConfirmDeleteCampaignModal",
	),
	"confirm-cancel-campaign": lazyModal(
		() => import("@/components/modals/confirm-cancel-campaign"),
		"ConfirmCancelCampaignModal",
	),
	"add-campaign-item": lazyModal(
		() => import("@/components/modals/add-campaign-item"),
		"AddCampaignItemModal",
	),
	"edit-campaign-item": lazyModal(
		() => import("@/components/modals/edit-campaign-item"),
		"EditCampaignItemModal",
	),
	"confirm-delete-campaign-item": lazyModal(
		() => import("@/components/modals/confirm-delete-campaign-item"),
		"ConfirmDeleteCampaignItemModal",
	),
	"create-pledge": lazyModal(
		() => import("@/components/modals/create-pledge"),
		"CreatePledgeModal",
	),
	"edit-pledge": lazyModal(
		() => import("@/components/modals/edit-pledge"),
		"EditPledgeModal",
	),
	"confirm-delete-pledge": lazyModal(
		() => import("@/components/modals/confirm-delete-pledge"),
		"ConfirmDeletePledgeModal",
	),
	"record-gift": lazyModal(
		() => import("@/components/modals/record-gift"),
		"RecordGiftModal",
	),
	"confirm-delete-transaction": lazyModal(
		() => import("@/components/modals/confirm-delete-transaction"),
		"ConfirmDeleteTransactionModal",
	),
	"member-pledge": lazyModal(
		() => import("@/components/modals/member-pledge"),
		"MemberPledgeModal",
	),
	"cancel-invitation": lazyModal(
		() => import("@/components/modals/cancel-invitation"),
		"CancelInvitationModal",
	),
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
