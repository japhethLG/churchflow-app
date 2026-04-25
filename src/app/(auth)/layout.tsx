import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";

export default ({ children }: { children: ReactNode }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${S.primaryFixed} 0%, #FFFFFF 55%, ${S.tertiaryContainer} 120%)`,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {children}
    </div>
  );
}
