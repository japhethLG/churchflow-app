import type { Perspective } from "./types";

export const perspectiveLabel = (p: Perspective): string =>
	p === "super" ? "Super Admin" : p === "admin" ? "Admin" : "Member";
