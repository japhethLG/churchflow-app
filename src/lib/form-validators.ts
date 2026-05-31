import { z } from "zod";

// Shared zod field factories. These reproduce the exact messages the
// inline schemas used before centralization — keep the message text
// byte-identical when adopting these.

/**
 * Positive monetary amount kept as a string (the inputs are text). Empty
 * fails `${requiredLabel} is required`; non-positive fails
 * `${label} must be greater than 0`.
 *
 * Defaults reproduce the record-gift / pledge "Amount" messages. The
 * campaign-item schemas pass `{ label: "Target", requiredLabel: "Target amount" }`
 * to match "Target amount is required" / "Target must be greater than 0".
 */
export const positiveAmount = (
	label = "Amount",
	requiredLabel: string = label,
) =>
	z
		.string()
		.min(1, `${requiredLabel} is required`)
		.refine((v) => Number(v) > 0, `${label} must be greater than 0`);

/** Trimmed non-empty string: `${label} is required`. */
export const requiredString = (label: string) =>
	z.string().trim().min(1, `${label} is required`);

/** Required email: trimmed, non-empty, valid. */
export const requiredEmail = () =>
	z.string().trim().min(1, "Email is required").email("Enter a valid email");

/** Optional email: empty string or a valid email. */
export const optionalEmail = () =>
	z.union([z.literal(""), z.string().email("Enter a valid email")]);
