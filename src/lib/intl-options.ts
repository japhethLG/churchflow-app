/**
 * Utilities for generating dynamic option lists from Intl APIs.
 */

/**
 * Get a list of all ISO 4217 currency codes supported by the environment.
 * Pairs code with its display name (e.g. { value: "PHP", label: "PHP — Philippine Peso" }).
 */
export const getCurrencyOptions = () => {
  try {
    // @ts-ignore - Intl.supportedValuesOf is ES2022
    const codes: string[] = (Intl as any).supportedValuesOf("currency");
    const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });

    // Prioritize commonly used currencies
    const priority = ["PHP", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "JPY", "NGN", "KES", "ZAR"];

    const options = codes.map((c) => ({
      value: c,
      label: `${c} — ${displayNames.of(c)}`,
    }));

    return options.sort((a, b) => {
      const aIdx = priority.indexOf(a.value);
      const bIdx = priority.indexOf(b.value);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.value.localeCompare(b.value);
    });
  } catch (e) {
    // Fallback if supportedValuesOf is not available
    return [
      { value: "PHP", label: "PHP — Philippine Peso" },
      { value: "USD", label: "USD — US Dollar" },
      { value: "EUR", label: "EUR — Euro" },
      { value: "GBP", label: "GBP — British Pound" },
      { value: "CAD", label: "CAD — Canadian Dollar" },
      { value: "AUD", label: "AUD — Australian Dollar" },
    ];
  }
};

/**
 * Get a list of all IANA timezones supported by the environment.
 * Pairs zone ID with a readable label (e.g. { value: "Asia/Manila", label: "Asia / Manila" }).
 */
export const getTimezoneOptions = () => {
  try {
    // @ts-ignore - Intl.supportedValuesOf is ES2022
    const zones: string[] = (Intl as any).supportedValuesOf("timeZone");

    // Prioritize some common ones
    const priority = ["Asia/Manila", "UTC", "America/New_York", "Europe/London"];

    const options = zones.map((tz) => ({
      value: tz,
      label: tz.replace(/_/g, " ").replace(/\//g, " / "),
    }));

    return options.sort((a, b) => {
      const aIdx = priority.indexOf(a.value);
      const bIdx = priority.indexOf(b.value);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.value.localeCompare(b.value);
    });
  } catch (e) {
    // Fallback
    return [
      { value: "UTC", label: "UTC" },
      { value: "Asia/Manila", label: "Asia / Manila" },
      { value: "America/New_York", label: "America / New York" },
      { value: "Europe/London", label: "Europe / London" },
    ];
  }
};

/**
 * Get a list of months for fiscal year selection.
 * Returns { value: "1", label: "January" } etc.
 */
export const getMonthOptions = () => {
  const formatter = new Intl.DateTimeFormat("en", { month: "long" });
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2021, i, 1);
    return {
      value: String(i + 1),
      label: formatter.format(date),
    };
  });
};

