"use client";

import { useId, type ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Input } from "@/components/primitives";

export type ReconcileChoice = "existing" | "sso" | "edit";

export type FieldReconcilerProps = {
  label: string;
  // The temp profile's value (admin-entered). Null/empty if missing.
  existing: string | null;
  // The fresh value from SSO (Google). Null/empty if SSO didn't provide it.
  sso: string | null;
  // What the user picked plus the editable buffer. Both controlled.
  choice: ReconcileChoice;
  edited: string;
  onChange: (next: { choice: ReconcileChoice; edited: string }) => void;
  hint?: ReactNode;
};

export const FieldReconciler = ({
  label,
  existing,
  sso,
  choice,
  edited,
  onChange,
  hint,
}: FieldReconcilerProps) => {
  const id = useId();
  const hasExisting = Boolean(existing && existing.length > 0);
  const hasSso = Boolean(sso && sso.length > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: S.onSurfaceMuted,
        }}
      >
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Option
          name={id}
          label="Keep existing"
          value={existing ?? "—"}
          disabled={!hasExisting}
          selected={choice === "existing"}
          onSelect={() => onChange({ choice: "existing", edited: existing ?? "" })}
        />
        <Option
          name={id}
          label="Use Google"
          value={sso ?? "—"}
          disabled={!hasSso}
          selected={choice === "sso"}
          onSelect={() => onChange({ choice: "sso", edited: sso ?? "" })}
        />
      </div>
      <button
        type="button"
        onClick={() => onChange({ choice: "edit", edited })}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: choice === "edit" ? S.primary : S.onSurfaceMuted,
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          alignSelf: "flex-start",
          textDecoration: "underline",
          textDecorationStyle: "dotted",
        }}
      >
        Or write something different
      </button>
      {choice === "edit" && (
        <Input value={edited} onChange={(e) => onChange({ choice: "edit", edited: e.target.value })} />
      )}
      {hint && <div style={{ fontSize: 12, color: S.onSurfaceMuted }}>{hint}</div>}
    </div>
  );
}

const Option = ({
  name,
  label,
  value,
  disabled,
  selected,
  onSelect,
}: {
  name: string;
  label: string;
  value: string;
  disabled: boolean;
  selected: boolean;
  onSelect: () => void;
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      data-name={name}
      style={{
        textAlign: "left",
        padding: "10px 12px",
        borderRadius: 12,
        border: `1.5px solid ${selected ? S.primary : "transparent"}`,
        background: selected ? S.primaryFixed : S.surfaceContainerHigh,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        fontFamily: "inherit",
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: S.onSurfaceMuted, marginBottom: 2 }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: S.onSurface,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </button>
  );
}
