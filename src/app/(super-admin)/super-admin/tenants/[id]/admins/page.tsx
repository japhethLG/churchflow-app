import { ScaffoldPage } from "@/components/pages/ScaffoldPage";

export default async function ManageTenantAdminsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScaffoldPage title="Manage admins" subtitle={`tenant: ${id}`} />;
}
