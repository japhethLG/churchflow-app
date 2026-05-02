// Barrel for all entity hooks + keys. Import from the entity folder
// directly for tighter tree-shaking; this re-export is a convenience.

export * from "./admin";
export * from "./auth";
export * from "./campaigns";
// Low-level client — use for imperative calls outside React (e.g. in
// server actions or auth flows that need Firebase state).
export { api } from "./client";
// Schema-coercion helpers for nullable fields (see coerce.ts).
export { nnum, nstr } from "./coerce";
export * from "./health";
// Generic escape hatches — reach for these when an endpoint isn't yet
// wrapped in an entity module.
export {
	invalidateAllApiQueries,
	invalidateByPaths,
	useApiMutation,
	useApiQuery,
} from "./hooks";
export * from "./invitations";
export * from "./members";
export * from "./pledges";
// Generated OpenAPI types.
export type { components, paths } from "./schema";
export * from "./tenants";
export * from "./transactions";
