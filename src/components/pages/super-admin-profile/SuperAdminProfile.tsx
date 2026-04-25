"use client";

import { PageHeader, Card, Input, Icon } from "@/components/primitives";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { useAuthMe } from "@/lib/api/auth";

export const SuperAdminProfile = () => {
  const { data: user } = useAuthMe();

  return (
    <div style={{ maxWidth: 640 }}>
      <PageHeader
        overline="Platform"
        title="Super Admin Profile"
        subtitle="Manage your platform-wide account details."
      />

      <Card style={{ marginTop: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            label="Display name"
            value={user?.displayName ?? ""}
            readOnly
            disabled
            placeholder="—"
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <Input
            label="Email address"
            icon="mail"
            value={user?.email ?? ""}
            readOnly
            disabled
            helper="Email is managed by your platform sign-in."
          />
        </div>

        <div
          style={{
            marginTop: 32,
            padding: "16px",
            background: S.surfaceContainerLow,
            borderRadius: 12,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <Icon name="settings" size={20} color={S.primary} />
          <div style={{ fontSize: 13, color: S.onSurfaceVariant }}>
            Super Admin profiles are currently managed via the platform identity provider.
          </div>
        </div>
      </Card>
    </div>
  );
}
