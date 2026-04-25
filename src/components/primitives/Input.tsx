import type { CSSProperties, ChangeEventHandler, HTMLInputTypeAttribute } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon, type IconName } from "./Icon";

export const Input = ({
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
  onChange,
  type = "text",
  disabled,
  readOnly,
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
  onChange?: ChangeEventHandler<HTMLInputElement>;
  type?: HTMLInputTypeAttribute;
  disabled?: boolean;
  readOnly?: boolean;
}) => {
  const interactive = Boolean(onChange);
  return (
    <div style={{ width: fullWidth ? "100%" : undefined }}>
      {label && (
        <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
          {label}
        </div>
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: disabled ? S.surfaceContainer : S.surfaceContainerHigh,
          borderRadius: 12,
          padding: "0 14px",
          height: 44,
          color: S.onSurface,
          border: error ? `1.5px solid ${S.error}` : "1.5px solid transparent",
          opacity: disabled ? 0.6 : 1,
          ...style,
        }}
      >
        {icon && <Icon name={icon} size={16} color={S.onSurfaceMuted} />}
        {prefix && <span style={{ color: S.onSurfaceMuted, fontSize: 14, flexShrink: 0 }}>{prefix}</span>}
        {interactive ? (
          <input
            type={type}
            value={value ?? ""}
            placeholder={placeholder}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 14,
              color: S.onSurface,
              fontFamily: "inherit",
              fontVariantNumeric: "tabular-nums",
              minWidth: 0,
            }}
          />
        ) : (
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
        )}
        {suffix && <span style={{ color: S.onSurfaceMuted, fontSize: 13, flexShrink: 0 }}>{suffix}</span>}
      </div>
      {helper && !error && (
        <div style={{ fontSize: 12, color: S.onSurfaceMuted, marginTop: 6 }}>{helper}</div>
      )}
      {error && <div style={{ fontSize: 12, color: S.error, marginTop: 6 }}>{error}</div>}
    </div>
  );
}
