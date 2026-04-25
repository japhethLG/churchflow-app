import type { CSSProperties, ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";

export const Card = ({
  children,
  padding = 24,
  style,
  bg,
}: {
  children: ReactNode;
  padding?: number;
  style?: CSSProperties;
  bg?: string;
}) => {
  return (
    <div
      style={{
        background: bg || S.surfaceContainerLowest,
        borderRadius: 16,
        padding,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
