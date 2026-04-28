import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const PageHeader = ({
  overline,
  title,
  subtitle,
  action,
  className,
}: {
  overline?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-end justify-between mb-8 gap-6", className)}>
      <div className="flex-1 min-w-0">
        {overline && (
          <div className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-2.5">
            {overline}
          </div>
        )}
        <h1 className="text-4xl font-bold tracking-tight text-foreground leading-[1.1] m-0">
          {title}
        </h1>
        {subtitle && (
          <div className="text-[15px] font-medium text-muted-foreground mt-2.5 max-w-[640px] leading-relaxed">
            {subtitle}
          </div>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}

export const SectionTitle = ({ title, action, className }: { title: ReactNode; action?: ReactNode; className?: string }) => {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <h3 className="text-[18px] font-bold tracking-tight text-foreground m-0">
        {title}
      </h3>
      {action}
    </div>
  );
}
