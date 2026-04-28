"use client";

import { useState } from "react";
import { Input } from "@/components/primitives";
import { useUpdateMember } from "@/lib/api/members";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";
import { cn } from "@/lib/utils";

type Member = components["schemas"]["MemberResponseDto"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "edit-member": EditMemberProps;
  }
}

export type EditMemberProps = {
  tenantSlug: string;
  member: Member;
};

const asString = (v: unknown): string => {
  return typeof v === "string" ? v : "";
};

export const EditMemberModal = ({ tenantSlug, member, onClose }: EditMemberProps & ModalBaseProps) => {
  const [firstName, setFirstName] = useState(member.firstName);
  const [lastName, setLastName] = useState(member.lastName);
  const [email, setEmail] = useState(asString(member.email));
  const [phone, setPhone] = useState(asString(member.phone));
  const [address, setAddress] = useState(asString(member.address));
  const [role, setRole] = useState<"USER" | "ADMIN">(member.role);
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(member.status);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useUpdateMember(tenantSlug);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug, id: member.id } },
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          role,
          status,
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  return (
    <BaseModal
      overline="Directory"
      title="Edit member"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Save", onClick: handleSave, loading: isPending, disabled: !canSubmit }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input label="Email" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Role</div>
            <div className="flex gap-2">
              <PillChoice active={role === "USER"} onClick={() => setRole("USER")} label="Member" />
              <PillChoice active={role === "ADMIN"} onClick={() => setRole("ADMIN")} label="Admin" />
            </div>
          </div>
          <div>
            <div className="mb-2 text-[13px] font-medium text-secondary-foreground">Status</div>
            <div className="flex gap-2">
              <PillChoice active={status === "ACTIVE"} onClick={() => setStatus("ACTIVE")} label="Active" />
              <PillChoice active={status === "INACTIVE"} onClick={() => setStatus("INACTIVE")} label="Inactive" />
            </div>
          </div>
        </div>

        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};

const PillChoice = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 cursor-pointer rounded-full border-[1.5px] px-3.5 py-2.5 font-inherit text-[13px] transition-colors",
        active
          ? "border-primary bg-accent font-semibold text-primary"
          : "border-transparent bg-input font-medium text-foreground",
      )}
    >
      {label}
    </button>
  );
};
