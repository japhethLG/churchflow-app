"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  PageHeader,
  Input,
  Button,
  Card,
  Icon,
} from "@/components/primitives";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useMyMembership, useUpdateMyMembership } from "@/lib/api/members";
import { nstr } from "@/lib/api/coerce";

export const MemberProfile = ({
  overline = "Account",
  title = "Personal Profile",
}: {
  overline?: string;
  title?: string;
}) => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const memberQ = useMyMembership(tenantSlug);
  const updateM = useUpdateMyMembership(tenantSlug);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (memberQ.data) {
      setForm({
        firstName: nstr(memberQ.data.firstName) ?? "",
        lastName: nstr(memberQ.data.lastName) ?? "",
        email: nstr(memberQ.data.email) ?? "",
        phone: nstr(memberQ.data.phone) ?? "",
        address: nstr(memberQ.data.address) ?? "",
      });
    }
  }, [memberQ.data]);

  const handleSave = async () => {
    try {
      await updateM.mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          address: form.address,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHeader
        overline={overline}
        title={title}
        subtitle="Manage your contact information and how the church office reaches you."
      />

      <Card style={{ marginTop: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input
            label="First name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="e.g. Amara"
          />
          <Input
            label="Last name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="e.g. Okonkwo"
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Input
            label="Email address"
            icon="mail"
            value={form.email}
            readOnly
            disabled
            helper="Email is managed by your sign-in provider."
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Input
            label="Phone number"
            icon="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 555 000 0000"
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Input
            label="Home address"
            icon="location"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Street, City, State, ZIP"
          />
        </div>

        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saved && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: S.onSurfaceVariant,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <Icon name="check" size={16} color={S.primary} />
                Profile updated successfully
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            loading={updateM.isPending}
            disabled={updateM.isPending}
          >
            Save changes
          </Button>
        </div>
      </Card>

      <div
        style={{
          marginTop: 40,
          padding: "24px",
          background: S.surfaceContainerLow,
          borderRadius: 16,
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: S.surfaceContainerHighest,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Icon name="bell" size={20} color={S.onSurfaceVariant} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: S.onSurface }}>
            Privacy Note
          </div>
          <div
            style={{
              fontSize: 13,
              color: S.onSurfaceVariant,
              marginTop: 4,
              lineHeight: 1.5,
            }}
          >
            Your information is only visible to authorized church administrators.
            We use this data to keep you informed about campaigns and to provide
            accurate giving statements.
          </div>
        </div>
      </div>
    </div>
  );
}
