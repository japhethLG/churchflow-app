// openapi-typescript represents `nullable: true` fields as
// `Record<string, never> | null` — strict TS rejects them anywhere a
// `string | null` is expected. These helpers narrow the runtime values
// (which are always real strings, nulls, or undefineds) to the shape
// the rest of the app cares about.

export const nstr = (v: unknown): string | null => {
	return typeof v === "string" && v.length > 0 ? v : null;
};

export const nnum = (v: unknown): number | null => {
	return typeof v === "number" ? v : null;
};
