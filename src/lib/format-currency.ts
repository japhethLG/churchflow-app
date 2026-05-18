/**
 * Centralized currency formatting utility.
 *
 * Uses the native `Intl.NumberFormat` API which already knows every ISO 4217
 * currency code, symbol, and decimal precision (e.g. JPY → 0 decimals,
 * BHD → 3 decimals, PHP → 2 decimals).
 *
 * Default currency is PHP (Philippine Peso, ₱).
 */

export type FormatCurrencyOptions = {
	/** ISO 4217 currency code. @default "PHP" */
	currency?: string;
	/** Number of decimal places. When omitted, uses the currency's standard precision. */
	decimals?: number;
	/** Locale for number formatting. @default "en-PH" */
	locale?: string;
};

/**
 * Format a number (or numeric string) as a currency string.
 *
 * @example
 *   formatCurrency(1234.5)           // "₱1,234.50"
 *   formatCurrency(1234.5, { currency: "USD" }) // "$1,234.50"
 *   formatCurrency("5000", { decimals: 0 })     // "₱5,000"
 */
export const formatCurrency = (
	value: number | string,
	options: FormatCurrencyOptions = {},
): string => {
	const { currency = "PHP", decimals, locale = "en-PH" } = options;

	const num = typeof value === "string" ? Number(value) : value;

	if (Number.isNaN(num)) {
		return "—";
	}

	const formatOptions: Intl.NumberFormatOptions = {
		style: "currency",
		currency,
		...(decimals !== undefined && {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}),
	};

	return new Intl.NumberFormat(locale, formatOptions).format(num);
};

/**
 * Get just the symbol for an ISO 4217 currency code.
 *
 * @example
 *   getCurrencySymbol("PHP") // "₱"
 *   getCurrencySymbol("USD") // "$"
 *   getCurrencySymbol("EUR") // "€"
 */
export const getCurrencySymbol = (currency = "PHP"): string => {
	try {
		return (
			new Intl.NumberFormat("en", {
				style: "currency",
				currency,
				currencyDisplay: "narrowSymbol",
			})
				.formatToParts(0)
				.find((p) => p.type === "currency")?.value ?? currency
		);
	} catch {
		return currency;
	}
};

/**
 * Format a number into a compact currency string (e.g. "₱1.2M", "₱45k").
 * Useful for dashboard KPIs and progress bars.
 *
 * @example
 *   formatCompact(1_500_000)          // "₱1.5M"
 *   formatCompact(42_000)             // "₱42k"
 *   formatCompact(800, { currency: "USD" }) // "$800"
 */
export const formatCompact = (
	value: number | string,
	options: Pick<FormatCurrencyOptions, "currency"> = {},
): string => {
	const { currency = "PHP" } = options;
	const symbol = getCurrencySymbol(currency);

	// Backend serializes Prisma Decimal as JSON strings. Coerce defensively.
	const num = typeof value === "string" ? Number(value) : value;
	if (!Number.isFinite(num)) {
		return "—";
	}

	if (num >= 1_000_000) {
		return `${symbol}${(num / 1_000_000).toFixed(1)}M`;
	}
	if (num >= 10_000) {
		return `${symbol}${(num / 1_000).toFixed(0)}k`;
	}
	if (num >= 1_000) {
		return `${symbol}${(num / 1_000).toFixed(1)}k`;
	}
	return `${symbol}${num.toFixed(0)}`;
};

/**
 * Format a number with decimal places and grouping, **without** a currency symbol.
 * Use this when the symbol is already provided separately (e.g. in the `<Amount>` component).
 *
 * @example
 *   formatAmount(1234.5)  // "1,234.50"
 *   formatAmount("5000")  // "5,000.00"
 */
export const formatAmount = (value: number | string, decimals = 2): string => {
	const num = typeof value === "string" ? Number(value) : value;
	if (Number.isNaN(num)) {
		return "—";
	}
	return num.toLocaleString("en-PH", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	});
};
