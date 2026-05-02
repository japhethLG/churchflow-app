"use client";

import { useApiQuery } from "../hooks";

export const useHealth = () => {
	return useApiQuery("/api/v1/health");
};
