// Barrel for all entity hooks + keys. Import from the entity folder
// directly for tighter tree-shaking; this re-export is a convenience.

export * from "./admin";
export * from "./auth";
export * from "./campaigns";
export * from "./health";
export * from "./invitations";
export * from "./members";
export * from "./pledges";
export * from "./tenants";
export * from "./transactions";

// Generic escape hatches — reach for these when an endpoint isn't yet
// wrapped in an entity module.
export {
  useApiQuery,
  useApiMutation,
  invalidateByPaths,
  invalidateAllApiQueries,
} from "./hooks";

// Low-level client — use for imperative calls outside React (e.g. in
// server actions or auth flows that need Firebase state).
export { api } from "./client";

// Generated OpenAPI types.
export type { paths, components } from "./schema";

// Schema-coercion helpers for nullable fields (see coerce.ts).
export { nstr, nnum } from "./coerce";
