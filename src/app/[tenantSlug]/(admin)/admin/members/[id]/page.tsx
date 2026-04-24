import { ScaffoldPage } from "@/components/pages/ScaffoldPage";

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScaffoldPage title="Member detail" subtitle={`id: ${id}`} />;
}
