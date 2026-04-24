import { ScaffoldPage } from "@/components/pages/ScaffoldPage";

export default async function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScaffoldPage title="Transaction detail" subtitle={`id: ${id}`} />;
}
