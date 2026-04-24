import { SANCTUARY as S } from "@/lib/design/tokens";

export function Wordmark({ size = "md", color }: { size?: "sm" | "md" | "lg"; color?: string }) {
  const sizes = { sm: 14, md: 18, lg: 22 } as const;
  const fs = sizes[size];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: color || S.primary,
        fontWeight: 600,
        letterSpacing: "-0.02em",
        fontSize: fs,
      }}
    >
      <div
        style={{
          width: fs + 6,
          height: fs + 6,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${S.primaryContainer}, ${S.primary})`,
          display: "grid",
          placeItems: "center",
          color: "#fff",
        }}
      >
        <svg
          width={fs - 2}
          height={fs - 2}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 20V10l8-6 8 6v10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      </div>
      <span>ChurchFlow</span>
    </div>
  );
}
