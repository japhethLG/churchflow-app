import { Icon } from "@/components/primitives/Icon";
import { cn } from "@/lib/utils";
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import type { Perspective } from "../types";

export const PlatformMenuItem = ({
  perspective,
  onSelect,
}: {
  perspective: Perspective;
  onSelect: () => void;
}) => (
  <DropdownMenuItem
    className={cn(
      "cursor-pointer gap-2.5 rounded-lg px-2.5 py-[9px] text-[13px]",
      perspective === "super" && "bg-accent font-semibold",
    )}
    style={{ color: "var(--tertiary)" }}
    onClick={onSelect}
  >
    <Icon
      name="chart"
      size={16}
      className="shrink-0"
      style={{ color: "var(--tertiary)" }}
    />
    <span className="flex-1">Platform</span>
    {perspective === "super" && (
      <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[var(--tertiary)]">
        Active
      </span>
    )}
  </DropdownMenuItem>
);
