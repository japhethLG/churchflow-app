"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";

// The consistent shell every modal renders inside. Owns the overlay,
// ESC-to-close, backdrop click, and spacing. Individual modals only need
// to compose the body + footer content.

type Size = "sm" | "md" | "lg";

type BaseModalProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: Size;
  onClose: () => void;
  // Set to false to block clicking the backdrop / ESC from closing — e.g.
  // while a destructive mutation is in-flight.
  dismissible?: boolean;
};

const WIDTHS: Record<Size, number> = { sm: 360, md: 480, lg: 640 };

export function BaseModal({
  title,
  description,
  children,
  footer,
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

  const overlay: CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, 0.55)",
    display: "grid",
    placeItems: "center",
    padding: 24,
    zIndex: 1000,
  };

  const panel: CSSProperties = {
    width: "100%",
    maxWidth: WIDTHS[size],
    background: S.surfaceContainerLowest,
    borderRadius: S.radiusLg,
    boxShadow: "0 24px 64px rgba(17, 24, 39, 0.25)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  };

  const header: CSSProperties = {
    padding: "24px 24px 8px",
    borderBottom: description ? "none" : undefined,
  };

  const body: CSSProperties = {
    padding: children ? "12px 24px 24px" : 0,
    color: S.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 1.5,
  };

  const footerRow: CSSProperties = {
    padding: "16px 24px",
    background: S.surfaceContainerLow,
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
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
        <div style={header}>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "-0.015em",
              color: S.onSurface,
            }}
          >
            {title}
          </h2>
          {description && (
            <p style={{ margin: "8px 0 0", fontSize: 14, color: S.onSurfaceMuted }}>
              {description}
            </p>
          )}
        </div>
        {children && <div style={body}>{children}</div>}
        {footer && <div style={footerRow}>{footer}</div>}
      </div>
    </div>
  );
}
