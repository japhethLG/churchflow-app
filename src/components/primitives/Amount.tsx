import { cn } from "@/lib/utils";

export const Amount = ({
  value,
  size = "row",
  currency = "$",
  gradient,
  className,
}: {
  value: string;
  size?: "label" | "row" | "display";
  currency?: string;
  gradient?: boolean;
  className?: string;
}) => {
  return (
    <span
      className={cn(
        "tabular-nums font-medium tracking-tight",
        size === "label" && "text-[13px]",
        size === "row" && "text-[14px]",
        size === "display" && "text-5xl font-semibold tracking-tighter",
        gradient 
          ? "bg-linear-to-br from-ring to-primary bg-clip-text text-transparent" 
          : "text-foreground",
        className
      )}
    >
      <span className="opacity-60 mr-0.5">{currency}</span>
      {value}
    </span>
  );
}
