import { cn } from "@/lib/utils";
import { getCurrencySymbol, formatAmount } from "@/lib/format-currency";

export const Amount = ({
  value,
  size = "row",
  currency,
  gradient,
  className,
}: {
  value: number | string;
  size?: "label" | "row" | "display";
  /** Symbol (e.g. "₱") or ISO code (e.g. "PHP"). Defaults to PHP. */
  currency?: string;
  gradient?: boolean;
  className?: string;
}) => {
  const symbol = currency?.length === 3 
    ? getCurrencySymbol(currency) 
    : (currency ?? getCurrencySymbol());

  const formattedValue = typeof value === "number" ? formatAmount(value) : value;

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
      <span className="opacity-60 mr-0.5">{symbol}</span>
      {formattedValue}
    </span>
  );
}
