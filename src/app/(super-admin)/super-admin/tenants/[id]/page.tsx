import { ScaffoldPage } from "@/components/pages/ScaffoldPage";

export default async function SuperAdminTenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScaffoldPage title="Church detail" subtitle={`id: ${id}`} />;
}
