import { ScaffoldPage } from "@/components/pages/ScaffoldPage";

/** Placeholder detail view — scaffold until member campaign UI is implemented. */
export const MemberCampaignDetailPage = async ({
	params,
}: {
	params: Promise<{ id: string }>;
}) => {
	const { id } = await params;
	return <ScaffoldPage title="Campaign" subtitle={`id: ${id}`} />;
};
