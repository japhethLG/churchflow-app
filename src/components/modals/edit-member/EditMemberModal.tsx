"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives";
import { useUpdateMember } from "@/lib/api/members";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";

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

const asString = (v: unknown): string  => {
  return typeof v === "string" ? v : "";
}

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
  }

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
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input label="Email" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>Role</div>
            <div style={{ display: "flex", gap: 8 }}>
              <PillChoice active={role === "USER"} onClick={() => setRole("USER")} label="Member" />
              <PillChoice active={role === "ADMIN"} onClick={() => setRole("ADMIN")} label="Admin" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>Status</div>
            <div style={{ display: "flex", gap: 8 }}>
              <PillChoice active={status === "ACTIVE"} onClick={() => setStatus("ACTIVE")} label="Active" />
              <PillChoice active={status === "INACTIVE"} onClick={() => setStatus("INACTIVE")} label="Inactive" />
            </div>
          </div>
        </div>

        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}

const PillChoice = ({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 14px",
        borderRadius: 9999,
        border: `1.5px solid ${active ? S.primary : "transparent"}`,
        background: active ? S.primaryFixed : S.surfaceContainerHigh,
        color: active ? S.primary : S.onSurface,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 13,
      }}
    >
      {label}
    </button>
  );
}
