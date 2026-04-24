import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon, type IconName } from "./Icon";

export function Chip({
  children,
  active,
  icon,
}: {
  children: ReactNode;
  active?: boolean;
  icon?: IconName;
}) {
  return (
    <button
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 14px",
        borderRadius: 9999,
        background: active ? S.onSurface : S.surfaceContainerLowest,
        color: active ? S.surfaceContainerLowest : S.onSurfaceVariant,
        fontSize: 13,
        fontWeight: 500,
        border: "none",
        cursor: "pointer",
        fontFamily: "inherit",
        letterSpacing: "-0.005em",
      }}
    >
      {icon && <Icon name={icon} size={14} />}
      {children}
    </button>
  );
}
