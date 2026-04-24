import type { CSSProperties } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon, type IconName } from "./Icon";

export function Input({
  label,
  icon,
  value,
  placeholder,
  helper,
  error,
  prefix,
  suffix,
  fullWidth = true,
  style,
}: {
  label?: string;
  icon?: IconName;
  value?: string;
  placeholder?: string;
  helper?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
  fullWidth?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={{ width: fullWidth ? "100%" : undefined }}>
      {label && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: S.onSurfaceVariant,
            marginBottom: 8,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: S.surfaceContainerHigh,
          borderRadius: 12,
          padding: "0 14px",
          height: 44,
          color: S.onSurface,
          ...style,
        }}
      >
        {icon && <Icon name={icon} size={16} color={S.onSurfaceMuted} />}
        {prefix && <span style={{ color: S.onSurfaceMuted, fontSize: 14 }}>{prefix}</span>}
        <span
          style={{
            flex: 1,
            fontSize: 14,
            color: value ? S.onSurface : S.onSurfaceMuted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value || placeholder}
        </span>
        {suffix && <span style={{ color: S.onSurfaceMuted, fontSize: 13 }}>{suffix}</span>}
      </div>
      {helper && !error && (
        <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 6 }}>{helper}</div>
      )}
      {error && <div style={{ fontSize: 12, color: S.error, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
