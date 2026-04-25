import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon } from "@/components/primitives/Icon";

export const TopBar = ({ breadcrumb = "Dashboard" }: { breadcrumb?: string }) => {
  return (
    <div
      style={{
        height: 72,
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "0 32px",
        background: "transparent",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: S.onSurfaceMuted,
        }}
      >
        {breadcrumb}
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: S.surfaceContainerLowest,
          borderRadius: 9999,
          padding: "8px 16px",
          width: 280,
        }}
      >
        <Icon name="search" size={15} color={S.onSurfaceMuted} />
        <span style={{ fontSize: 13, color: S.onSurfaceMuted }}>Search members, events…</span>
        <span
          style={{
            fontSize: 11,
            color: S.onSurfaceMuted,
            marginLeft: "auto",
            background: S.surfaceContainer,
            padding: "2px 8px",
            borderRadius: 6,
          }}
        >
          ⌘K
        </span>
      </div>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: S.surfaceContainerLowest,
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        <Icon name="bell" size={18} color={S.onSurfaceVariant} />
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: S.tertiary,
            border: `2px solid ${S.surfaceContainerLowest}`,
          }}
        />
      </div>
    </div>
  );
}
