import type { ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { PageHeader } from "@/components/primitives";

// Placeholder "this page isn't implemented yet" shell. Kept around so
// route scaffolding is visible in the app without pretending the
// features are finished. Each page gets a real implementation later.
export function ScaffoldPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div style={{ padding: "24px 0", maxWidth: 1100 }}>
      <PageHeader title={title} subtitle={subtitle} />
      <div
        style={{
          marginTop: 24,
          padding: 32,
          borderRadius: 16,
          background: S.surfaceContainerLowest,
          border: `1px dashed ${S.outlineVariant}`,
          color: S.onSurfaceMuted,
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        {children ?? (
          <>
            Not built yet — this page is scaffolded so the route and role
            gating are real, but the UI will land later.
          </>
        )}
      </div>
    </div>
  );
}
