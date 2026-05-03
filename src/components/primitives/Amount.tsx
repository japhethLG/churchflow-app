import { formatAmount, getCurrencySymbol } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

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
	const symbol =
		currency?.length === 3
			? getCurrencySymbol(currency)
			: (currency ?? getCurrencySymbol());

	const formattedValue =
		typeof value === "number" ? formatAmount(value) : value;

	return (
		<span
			className={cn(
				"tabular-nums font-medium tracking-tight",
				size === "label" && "text-sm",
				size === "row" && "text-sm",
				size === "display" && "text-5xl font-semibold tracking-tighter",
				gradient
					? "bg-linear-to-br from-ring to-primary bg-clip-text text-transparent"
					: "text-foreground",
				className,
			)}
		>
			<span className="opacity-60 mr-0.5">{symbol}</span>
			{formattedValue}
		</span>
	);
};
