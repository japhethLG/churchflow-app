"use client";

import { SANCTUARY as S } from "@/lib/design/tokens";

const MESSAGES = [
  "Thank you for your faithful giving, {name}. Your contributions this month are helping sustain our weekly ministries.",
  "Your generosity makes a real difference, {name}. Every gift supports the work of this community.",
  "Thank you for being a cheerful giver, {name}. Your faithfulness inspires others around you.",
  "Your giving matters, {name}. Together, we're building something that lasts.",
];

export const MemberThankYou = ({ name }: { name: string }) => {
  // Rotate message based on day of month for variety
  const dayIndex = new Date().getDate() % MESSAGES.length;
  const message = MESSAGES[dayIndex].replace("{name}", name);

  return (
    <div
      style={{
        padding: "20px 28px",
        borderRadius: 16,
        background: `linear-gradient(90deg, ${S.tertiaryContainer}, ${S.surfaceContainerLowest})`,
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: S.tertiary + "20",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={S.tertiary}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 15,
            color: S.tertiary,
            fontStyle: "italic",
            letterSpacing: "-0.005em",
            lineHeight: 1.5,
          }}
        >
          &ldquo;{message}&rdquo;
        </div>
      </div>
    </div>
  );
}
