import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon, type IconName } from "./Icon";

type ButtonProps = {
  children?: ReactNode;
  variant?: "primary" | "secondary" | "tertiary" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  fullWidth?: boolean;
  destructive?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size">;

export function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  fullWidth,
  disabled,
  destructive,
  style,
  ...rest
}: ButtonProps) {
  const sizes: Record<NonNullable<ButtonProps["size"]>, CSSProperties> = {
    sm: { padding: "6px 14px", fontSize: 13, height: 32, gap: 6 },
    md: { padding: "10px 20px", fontSize: 14, height: 40, gap: 8 },
    lg: { padding: "14px 24px", fontSize: 15, height: 48, gap: 10 },
  };
  const common: CSSProperties = {
    ...sizes[size],
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    fontWeight: 500,
    cursor: disabled ? "default" : "pointer",
    border: "none",
    letterSpacing: "-0.005em",
    whiteSpace: "nowrap",
    width: fullWidth ? "100%" : undefined,
    opacity: disabled ? 0.5 : 1,
    fontFamily: "inherit",
  };
  const variants: Record<NonNullable<ButtonProps["variant"]>, CSSProperties> = {
    primary: {
      background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
      color: "#fff",
    },
    secondary: {
      background: S.surfaceContainer,
      color: S.onSurface,
    },
    tertiary: {
      background: "transparent",
      color: destructive ? S.error : S.onSurfaceVariant,
    },
    ghost: {
      background: "transparent",
      color: S.onSurface,
    },
  };
  return (
    <button style={{ ...common, ...variants[variant], ...style }} disabled={disabled} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 14 : 16} />}
    </button>
  );
}
