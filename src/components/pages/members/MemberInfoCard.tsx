"use client";

import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Avatar, Badge, Card, SectionTitle, StatusBadge } from "@/components/primitives";
import type { components } from "@/lib/api";

type Member = components["schemas"]["MemberResponseDto"];

const asString = (v: unknown): string | null  => {
  return typeof v === "string" && v.length > 0 ? v : null;
}

export const MemberInfoCard = ({ member, footer }: { member: Member; footer?: ReactNode }) => {
  const name = `${member.firstName} ${member.lastName}`.trim();
  return (
    <Card padding={28}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <Avatar name={name} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>{name}</h2>
            {!member.userId && <Badge color="clay">temp</Badge>}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Badge color={member.role === "ADMIN" ? "indigo" : "neutral"}>{member.role}</Badge>
            <StatusBadge status={member.status === "ACTIVE" ? "Active" : "Inactive"} />
          </div>
        </div>
        {footer}
      </div>

      <SectionTitle title="Contact" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Email" value={asString(member.email)} />
        <Field label="Phone" value={asString(member.phone)} />
        <Field label="Address" value={asString(member.address)} colspan />
      </div>
    </Card>
  );
}

const Field = ({ label, value, colspan }: { label: string; value: string | null; colspan?: boolean }) => {
  return (
    <div style={{ gridColumn: colspan ? "1 / -1" : undefined }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: S.onSurfaceMuted,
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, color: value ? S.onSurface : S.onSurfaceMuted }}>{value ?? "—"}</div>
    </div>
  );
}
