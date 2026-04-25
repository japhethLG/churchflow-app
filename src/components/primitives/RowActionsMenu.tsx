"use client";

import { useState, type CSSProperties } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Icon } from "./Icon";

export type RowAction = {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  separatorBefore?: boolean;
};

const item: CSSProperties = {
  padding: "8px 16px",
  fontSize: 13,
  cursor: "pointer",
  display: "block",
  width: "100%",
  textAlign: "left",
  background: "none",
  border: "none",
  fontFamily: "inherit",
  color: S.onSurface,
  borderRadius: 8,
};

export function RowActionsMenu({ actions, label = "Row actions" }: { actions: RowAction[]; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative", display: "inline-block" }} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={label}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 4,
          color: S.onSurfaceMuted,
          display: "grid",
          placeItems: "center",
          borderRadius: 8,
          transition: "background 80ms, color 80ms",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = S.surfaceContainerLow;
          e.currentTarget.style.color = S.onSurface;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.color = S.onSurfaceMuted;
        }}
      >
        <Icon name="dots" size={18} />
      </button>
      {open && (
        <>
          <div 
            style={{ position: "fixed", inset: 0, zIndex: 9 }} 
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }} 
          />
          <div
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 4px)",
              background: S.surfaceContainerLowest,
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(17,24,39,0.18)",
              padding: 6,
              minWidth: 180,
              zIndex: 10,
            }}
          >
            {actions.map((a, i) => (
              <span key={i}>
                {a.separatorBefore && (
                  <hr style={{ margin: "4px 0", border: "none", borderTop: `1px solid ${S.surfaceContainer}` }} />
                )}
                <button
                  style={{ ...item, color: a.destructive ? S.error : S.onSurface }}
                  onClick={a.onClick}
                >
                  {a.label}
                </button>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
