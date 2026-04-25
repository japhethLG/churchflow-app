"use client";

import type { ComponentType } from "react";
import { useModalStore } from "./store";
import type { ModalBaseProps, ModalName } from "./registry";
// Importing the modals barrel loads every modal's `declare module`
// augmentation so ModalPropsMap is fully populated here.
import "@/components/modals";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";
import { EditTenantModal } from "@/components/modals/edit-tenant";
import { RenameTenantSlugModal } from "@/components/modals/rename-tenant-slug";
import { ConfirmDeleteTenantModal } from "@/components/modals/confirm-delete-tenant";
import { ConfirmRestoreTenantModal } from "@/components/modals/confirm-restore-tenant";
import { InviteTenantAdminModal } from "@/components/modals/invite-tenant-admin";
import { InviteAdminGlobalModal } from "@/components/modals/invite-admin-global";
import { ConfirmToggleSuperAdminModal } from "@/components/modals/confirm-toggle-super-admin";
import { AddMemberModal } from "@/components/modals/add-member";
import { EditMemberModal } from "@/components/modals/edit-member";
import { ConfirmDeleteMemberModal } from "@/components/modals/confirm-delete-member";
import { InviteMemberModal } from "@/components/modals/invite-member";
import { MergeMemberModal } from "@/components/modals/merge-member";

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
};

export function ModalHost() {
  const { active, close } = useModalStore();
  if (!active) return null;
  const { name, props } = active as {
    name: ModalName;
    props: Record<string, unknown>;
  };
  const Comp = registry[name];
  if (!Comp) return null;
  return <Comp {...props} onClose={close} />;
}
