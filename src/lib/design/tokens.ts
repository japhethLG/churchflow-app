// Sanctuary design tokens (ported from designs/tokens.js)
export const SANCTUARY = {
  primary: "#3525CD",
  primaryContainer: "#4F46E5",
  primaryFixed: "#E6E6FA",
  onPrimary: "#FFFFFF",
  tertiary: "#7E3000",
  tertiaryContainer: "#FBE9DD",

  surface: "#F7F9FB",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F1F3F6",
  surfaceContainer: "#ECEEF0",
  surfaceContainerHigh: "#E4E7EB",
  surfaceContainerHighest: "#DCE0E5",

  onSurface: "#191C1E",
  onSurfaceVariant: "#42474E",
  onSurfaceMuted: "#6B7280",
  outline: "#72787E",
  outlineVariant: "#C2C7CE",

  success: "#156B3D",
  successContainer: "#C8EFD4",
  warning: "#8B5A00",
  warningContainer: "#FDE8B8",
  error: "#8C1D18",
  errorContainer: "#F9DEDC",
  info: "#1B4C8C",
  infoContainer: "#D6E6FB",

  txTithe: "#4F46E5",
  txOffering: "#16A34A",
  txMission: "#2563EB",
  txFirstFruit: "#D97706",
  txCommitment: "#9333EA",
  txDonation: "#0D9488",
  txOther: "#6B7280",

  radiusSm: "8px",
  radiusMd: "12px",
  radiusLg: "16px",
  radiusXl: "24px",
  radiusFull: "9999px",
} as const;

export type SanctuaryTokens = typeof SANCTUARY;
