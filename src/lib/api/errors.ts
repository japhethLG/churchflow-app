// Shape consumers can rely on instead of guessing at .statusCode ?? .status
// on the raw error returned by openapi-fetch.
export class ApiError extends Error {
	readonly status: number;
	readonly code: string | null;
	readonly details: unknown;

	constructor(opts: {
		status: number;
		message: string;
		code?: string | null;
		details?: unknown;
	}) {
		super(opts.message);
		this.name = "ApiError";
		this.status = opts.status;
		this.code = opts.code ?? null;
		this.details = opts.details ?? null;
	}
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

// Backend errors come through openapi-fetch as the raw JSON body. The
// shape varies by source: NestJS validation pipes return
// { statusCode, message, error }; our FirebaseAuthGuard returns
// { statusCode, message, error: "Unauthorized" }; some endpoints return
// { error, message }. Normalise to ApiError.
export const toApiError = (status: number, body: unknown): ApiError => {
	const b = (body && typeof body === "object" ? body : {}) as Record<
		string,
		unknown
	>;
	const message =
		typeof b.message === "string"
			? b.message
			: typeof b.error === "string"
				? b.error
				: `Request failed with status ${status}`;
	const code = typeof b.error === "string" ? b.error : null;
	return new ApiError({ status, message, code, details: body });
};
