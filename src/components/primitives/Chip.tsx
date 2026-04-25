import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon, type IconName } from "./Icon";

export const Chip = ({
  children,
  active,
  icon,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  icon?: IconName;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
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
