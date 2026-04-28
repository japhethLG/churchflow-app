import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/lib/utils";

export const Chip = ({
  children,
  active,
  icon,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  icon?: IconName;
  onClick?: () => void;
  className?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer",
        active 
          ? "bg-foreground text-background" 
          : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
    >
      {icon && <Icon name={icon} size={14} className={cn(active ? "text-background" : "text-muted-foreground")} />}
      {children}
    </button>
  );
}
