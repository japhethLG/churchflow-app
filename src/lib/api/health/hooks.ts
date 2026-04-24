"use client";

import { useApiQuery } from "../hooks";

export function useHealth() {
  return useApiQuery("/api/v1/health");
}
