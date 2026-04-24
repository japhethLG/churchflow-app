import { ScaffoldPage } from "@/components/pages/ScaffoldPage";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScaffoldPage title="Campaign detail" subtitle={`id: ${id}`} />;
}
