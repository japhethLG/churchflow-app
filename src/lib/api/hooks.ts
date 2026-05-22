"use client";

import {
	type QueryClient,
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
} from "@tanstack/react-query";
import { api } from "./client";
import type { paths } from "./schema";

// Type surface: consumers see fully-typed paths/methods from openapi-fetch.
// Internals cast through `any` to stay tolerant of an empty `paths` stub
// (before `npm run api:types` has ever been run against a live backend).

type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

type PathsWithMethod<M extends HttpMethod> = {
	[P in keyof paths]: paths[P] extends { [_ in M]: unknown } ? P : never;
}[keyof paths];

type GetInit<P, M extends HttpMethod> = P extends keyof paths
	? paths[P] extends { [_ in M]: infer Op }
		? Op extends { parameters: infer Params }
			? Op extends {
					requestBody: { content: { "application/json": infer Body } };
				}
				? { params: Params; body: Body }
				: { params: Params }
			: Record<string, never>
		: never
	: never;

type GetResponse<P, M extends HttpMethod> = P extends keyof paths
	? paths[P] extends { [_ in M]: infer Op }
		? Op extends {
				responses: {
					[code in 200 | 201]?: { content: { "application/json": infer R } };
				};
			}
			? R
			: unknown
		: unknown
	: unknown;

// Schema-derived helpers — wrapper hooks should pluck these from `paths`
// instead of redeclaring query/path/body shapes by hand. Keeps the OpenAPI
// schema as the single source of truth.
type GetParams<P, M extends HttpMethod> = P extends keyof paths
	? paths[P] extends { [_ in M]: infer Op }
		? Op extends { parameters: infer Params }
			? Params
			: never
		: never
	: never;

export type GetQuery<P, M extends HttpMethod> =
	GetParams<P, M> extends {
		query?: infer Q;
	}
		? Q
		: never;

export type GetPathParams<P, M extends HttpMethod> =
	GetParams<P, M> extends { path: infer Pp } ? Pp : never;

export type GetBody<P, M extends HttpMethod> = P extends keyof paths
	? paths[P] extends { [_ in M]: infer Op }
		? Op extends {
				requestBody: { content: { "application/json": infer B } };
			}
			? B
			: never
		: never
	: never;

export const useApiQuery = <P extends PathsWithMethod<"get">>(
	path: P,
	init?: GetInit<P, "get">,
	options?: Omit<
		UseQueryOptions<GetResponse<P, "get">, Error>,
		"queryKey" | "queryFn"
	>,
) => {
	return useQuery<GetResponse<P, "get">, Error>({
		queryKey: [path, init],
		queryFn: async () => {
			// biome-ignore lint/suspicious/noExplicitAny: internal type dispatch
			const { data, error } = await (api as any).GET(path, init);
			if (error) {
				throw error;
			}
			return data as GetResponse<P, "get">;
		},
		...options,
	});
};

export const useApiMutation = <
	M extends Exclude<HttpMethod, "get">,
	P extends PathsWithMethod<M>,
>(
	path: P,
	method: M,
	options?: Omit<
		UseMutationOptions<GetResponse<P, M>, Error, GetInit<P, M>>,
		"mutationFn"
	>,
) => {
	return useMutation<GetResponse<P, M>, Error, GetInit<P, M>>({
		mutationFn: async (init) => {
			const verb = method.toUpperCase() as "POST" | "PUT" | "PATCH" | "DELETE";
			// biome-ignore lint/suspicious/noExplicitAny: internal type dispatch
			const { data, error } = await (api as any)[verb](path, init);
			if (error) {
				throw error;
			}
			return data as GetResponse<P, M>;
		},
		...options,
	});
};

// Query keys are [path, init] — where path is the literal OpenAPI template
// string ("/api/v1/tenants/{id}") and init is the request params/body. This
// helper invalidates every cached query whose path is one of the given
// template strings. Per-entity `keys.ts` files use this to define precise
// invalidation scopes.
export const invalidateByPaths = (
	qc: QueryClient,
	paths: readonly string[],
) => {
	const set = new Set<string>(paths);
	return qc.invalidateQueries({
		predicate: (q) =>
			typeof q.queryKey[0] === "string" && set.has(q.queryKey[0] as string),
	});
};

// Nuclear: invalidate every API query. Use after operations that change the
// caller's identity or permissions (sign-in, tenant switch, sign-out).
export const invalidateAllApiQueries = (qc: QueryClient) => {
	return qc.invalidateQueries({
		predicate: (q) =>
			typeof q.queryKey[0] === "string" &&
			(q.queryKey[0] as string).startsWith("/api/v1/"),
	});
};
