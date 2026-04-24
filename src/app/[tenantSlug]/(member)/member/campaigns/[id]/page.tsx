import { ScaffoldPage } from "@/components/pages/ScaffoldPage";

export default async function MemberCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ScaffoldPage title="Campaign" subtitle={`id: ${id}`} />;
}
