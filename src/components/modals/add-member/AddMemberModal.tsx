"use client";

import { useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives";
import { useCreateMember } from "@/lib/api/members";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "add-member": AddMemberProps;
  }
}

export type AddMemberProps = {
  tenantSlug: string;
};

export const AddMemberModal = ({ tenantSlug, onClose }: AddMemberProps & ModalBaseProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useCreateMember(tenantSlug);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSave = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          role: "USER",
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    }
  }

  return (
    <BaseModal
      overline="Directory"
      title="Add member"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{ label: "Add member", onClick: handleSave, loading: isPending, disabled: !canSubmit }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: S.onSurfaceMuted }}>
          Adds a temp member you can attribute giving to. They can claim the
          profile later — invite them with a sign-in link via <strong>Invite member</strong> instead
          if they should access ChurchFlow themselves.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Input label="Email (optional)" value={email} type="email" onChange={(e) => setEmail(e.target.value)} />
        <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} />
        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}
      </div>
    </BaseModal>
  );
}
