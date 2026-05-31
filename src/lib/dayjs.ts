import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { nstr } from "@/lib/api/coerce";

// `utc` lets callers reach for `dayjs.utc()` when computing boundaries
// they intend to ship over the wire. Without it, `dayjs().startOf("month")`
// resolves in the browser's local timezone before `toISOString()` stamps a
// UTC `Z` — which produces a wrong cutoff for users near a TZ boundary.
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(relativeTime);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export default dayjs;

// ---------------------------------------------------------------------------
// Date-only helpers — UTC-day semantics for CALENDAR-DAY fields (gift date,
// campaign / item deadlines). The contract is: the backend stores & returns
// these as the UTC-midnight instant of the picked calendar day. Routing every
// write / render through these keeps call sites from improvising between
// `dayjs(...)` (browser-local) and `dayjs.utc(...)` — the mismatch that let a
// gift dated "June 1" be stored at the prior day for UTC+ users and then
// dropped by the (correct) UTC date-range filter.
//
// Do NOT use these for genuine INSTANTS (createdAt / deletedAt / "x ago") —
// those are real moments in time and should render in the viewer's locale.
// ---------------------------------------------------------------------------

/**
 * WRITE / lower filter bound. Serialize a user-picked calendar day
 * (`YYYY-MM-DD` from DatePicker/DateRangePicker) as the UTC start-of-day
 * instant, so the stored day matches the day the user picked regardless of
 * their timezone.
 */
export const toUtcDayStart = (date: string): string =>
	dayjs.utc(date).startOf("day").toISOString();

/**
 * Inclusive upper filter bound — UTC end-of-day instant for a picked day.
 */
export const toUtcDayEnd = (date: string): string =>
	dayjs.utc(date).endOf("day").toISOString();

/**
 * RENDER a date-only field in UTC, so a UTC-midnight instant displays as the
 * calendar day it represents for every viewer. Do NOT use for instants.
 */
export const formatUtcDate = (iso: string, fmt: string): string =>
	dayjs.utc(iso).format(fmt);

/**
 * Relative label for a DATE-ONLY field (gift date, deadline): "Today",
 * "Yesterday", or "Nd ago" within the last week, otherwise the date formatted
 * with `fallbackFormat`. Uses a UTC calendar-day difference, so the label is
 * offset-independent and never fabricates a time-of-day. Do NOT use for
 * instants (createdAt / "x ago").
 */
export const relativeUtcDate = (
	iso: string,
	fallbackFormat = "MMM D",
): string => {
	const day = dayjs.utc(iso).startOf("day");
	const today = dayjs.utc().startOf("day");
	const daysDiff = today.diff(day, "day");
	if (daysDiff <= 0) {
		return "Today";
	}
	if (daysDiff === 1) {
		return "Yesterday";
	}
	if (daysDiff < 7) {
		return `${daysDiff}d ago`;
	}
	return formatUtcDate(iso, fallbackFormat);
};

/**
 * Widen a calendar-day range (`YYYY-MM-DD` from DateRangePicker) into the
 * wire shape list hooks expect: UTC start-of-day for the lower bound and
 * UTC end-of-day for the (inclusive) upper bound, omitting absent bounds.
 * This is the single source for the UTC-day widening the anti-patterns
 * table calls out — model for transactions/TransactionsListPage toWireRange.
 */
export const dateRangeToWire = (range: {
	from?: string;
	to?: string;
}): { dateFrom?: string; dateTo?: string } => ({
	dateFrom: range.from ? toUtcDayStart(range.from) : undefined,
	dateTo: range.to ? toUtcDayEnd(range.to) : undefined,
});

/**
 * Normalize a wire date value into a `YYYY-MM-DD` string for an
 * `<input type="date">` / DatePicker value. Returns "" when null/blank.
 */
export const toDateInput = (d: unknown): string => {
	const s = nstr(d);
	if (!s) {
		return "";
	}
	return formatUtcDate(s, "YYYY-MM-DD");
};
