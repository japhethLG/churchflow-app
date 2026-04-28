import { cn } from "@/lib/utils";
import { Church } from "lucide-react";

export const Wordmark = ({ size = "md", color, className }: { size?: "sm" | "md" | "lg"; color?: string; className?: string }) => {
  const sizes = { sm: 14, md: 18, lg: 22 } as const;
  const fs = sizes[size];
  
  return (
    <div
      className={cn("flex items-center gap-2.5 font-bold tracking-tight", className)}
      style={{ fontSize: fs, color: color || "var(--primary)" }}
    >
      <div
        className="rounded-lg bg-linear-to-br from-ring to-primary grid place-items-center text-white shrink-0"
        style={{ width: fs + 6, height: fs + 6 }}
      >
        <Church size={fs - 2} strokeWidth={2.5} />
      </div>
      <span className="text-foreground">ChurchFlow</span>
    </div>
  );
}
