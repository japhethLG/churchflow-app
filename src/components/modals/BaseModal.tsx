"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Button } from "@/components/primitives/Button";

// Shell every modal renders inside. Owns the overlay, ESC-to-close,
// backdrop click, header (overline + title + close), body, and footer.
// Individual modals only configure the body and action buttons.

type Size = "sm" | "md" | "lg" | "xl";

export type ModalAction = {
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "tertiary";
  destructive?: boolean;
};

type BaseModalProps = {
  overline?: string;
  title: string;
  showClose?: boolean;
  children: ReactNode;
  // Footer — omit all three to render no footer at all
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  footerHint?: string;
  // Shell
  size?: Size;
  onClose: () => void;
  dismissible?: boolean;
};

const WIDTHS: Record<Size, number> = { sm: 400, md: 560, lg: 720, xl: 920 };

export function BaseModal({
  overline,
  title,
  showClose = true,
  children,
  primaryAction,
  secondaryAction,
  footerHint,
  size = "md",
  onClose,
  dismissible = true,
}: BaseModalProps) {
  useEffect(() => {
    if (!dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [dismissible, onClose]);

  const hasFooter = primaryAction || secondaryAction || footerHint;

  const overlay: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(53, 37, 205, 0.18)",
    backdropFilter: "blur(8px)",
    display: "grid",
    placeItems: "center",
    padding: 24,
    zIndex: 1000,
  };

  const panel: CSSProperties = {
    width: "100%",
    maxWidth: WIDTHS[size],
    background: S.surfaceContainerLowest,
    borderRadius: S.radiusXl,
    boxShadow: "0 30px 80px -20px rgba(79, 70, 229, 0.35)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const header: CSSProperties = {
    padding: "24px 32px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  };

  const closeBtn: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: S.surfaceContainerLow,
    border: "none",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    color: S.onSurfaceMuted,
    fontFamily: "inherit",
  };

  const body: CSSProperties = {
    padding: "32px",
    flex: 1,
    overflowY: "auto",
  };

  const footer: CSSProperties = {
    padding: "20px 32px",
    borderTop: `1px solid ${S.surfaceContainer}`,
    display: "flex",
    justifyContent: hasFooter && (secondaryAction || primaryAction) ? "space-between" : "flex-end",
    alignItems: "center",
    gap: 8,
    background: S.surfaceContainerLowest,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={overlay}
      onClick={dismissible ? onClose : undefined}
    >
      <div style={panel} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={header}>
          <div>
            {overline && (
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: S.onSurfaceMuted,
                  marginBottom: 4,
                }}
              >
                {overline}
              </div>
            )}
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: S.onSurface,
              }}
            >
              {title}
            </h2>
          </div>
          {showClose && (
            <button style={closeBtn} onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div style={body}>{children}</div>

        {/* Footer */}
        {hasFooter && (
          <div style={footer}>
            {footerHint ? (
              <span style={{ fontSize: 11, color: S.onSurfaceMuted }}>{footerHint}</span>
            ) : (
              <span />
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {secondaryAction && (
                <Button
                  variant={secondaryAction.variant ?? "tertiary"}
                  destructive={secondaryAction.destructive}
                  onClick={secondaryAction.onClick}
                  disabled={secondaryAction.disabled || secondaryAction.loading}
                >
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction && (
                <Button
                  variant={primaryAction.variant ?? "primary"}
                  destructive={primaryAction.destructive}
                  onClick={primaryAction.onClick}
                  disabled={primaryAction.disabled || primaryAction.loading}
                >
                  {primaryAction.loading ? "Saving…" : primaryAction.label}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
