import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";

export const PageHeader = ({
  overline,
  title,
  subtitle,
  action,
}: {
  overline?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 32,
        gap: 24,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {overline && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: S.onSurfaceMuted,
              marginBottom: 10,
            }}
          >
            {overline}
          </div>
        )}
        <h1
          style={{
            fontSize: 36,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: S.onSurface,
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <div
            style={{
              fontSize: 15,
              color: S.onSurfaceVariant,
              marginTop: 10,
              maxWidth: 640,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {action && <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>{action}</div>}
    </div>
  );
}

export const SectionTitle = ({ title, action }: { title: ReactNode; action?: ReactNode }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: S.onSurface,
          margin: 0,
        }}
      >
        {title}
      </h3>
      {action}
    </div>
  );
}
