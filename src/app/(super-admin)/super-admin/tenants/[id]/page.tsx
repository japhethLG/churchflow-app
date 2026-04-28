"use client";

import { use } from "react";
import { TenantDetailPage } from "@/components/pages/super-admin/tenants";

export default ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = use(params);
  return <TenantDetailPage id={id} />;
};
