import type { Perspective } from "./types";
import { perspectiveLabel } from "./perspective";

export const BrandHeader = ({
  perspective,
  churchName,
}: {
  perspective: Perspective;
  churchName: string;
}) => {
  const initials = churchName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isPlatform = perspective === "super";

  return (
    <div className="mb-5 flex items-center gap-2.5 px-1.5 py-1">
      <div
        className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-white"
        style={{
          background: isPlatform
            ? "linear-gradient(135deg, var(--tertiary), var(--warning))"
            : "linear-gradient(135deg, var(--ring), var(--primary))",
        }}
      >
        {isPlatform ? "⚡" : initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold tracking-tight text-foreground">
          {isPlatform ? "Platform" : churchName}
        </div>
        <div className="text-[11px] font-medium text-muted-foreground">
          {perspectiveLabel(perspective)}
        </div>
      </div>
    </div>
  );
};
