"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { Button, PageHeader } from "@/components/primitives";
import { nstr } from "@/lib/api";
import { useCampaign, useUpdateCampaign } from "@/lib/api/campaigns";
import dayjs from "@/lib/dayjs";
import { CampaignForm } from "./CampaignForm";
import type { CampaignFormValues } from "./formHelpers";

const toDateInput = (d: unknown): string => {
	const s = nstr(d);
	if (!s) return "";
	return dayjs(s).format("YYYY-MM-DD");
};

export const CampaignEditPage = () => {
	const router = useRouter();
	const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
	const { data: campaign, isLoading } = useCampaign(tenantSlug, id);
	const updateCampaign = useUpdateCampaign(tenantSlug);

	const initialValues = useMemo(() => {
		if (!campaign) return undefined;
		return {
			title: campaign.title,
			description: nstr(campaign.description) ?? "",
			deadline: toDateInput(campaign.deadline),
			status: campaign.status,
			items: campaign.items.map((i, idx) => ({
				tempId: `existing-${idx}`,
				id: i.id,
				title: i.title,
				description: nstr(i.description) ?? "",
				targetAmount: i.targetAmount,
				deadline: toDateInput(i.deadline),
			})),
		} satisfies Partial<CampaignFormValues>;
	}, [campaign]);

	const onSubmit = async (values: CampaignFormValues) => {
		await updateCampaign.mutateAsync({
			params: { path: { tenantId: tenantSlug, id } },
			body: {
				title: values.title.trim(),
				description: values.description?.trim() || undefined,
				deadline: values.deadline
					? dayjs(values.deadline).toISOString()
					: undefined,
				status: values.status,
			},
		});
		router.push(`/${tenantSlug}/admin/campaigns/${id}`);
	};

	if (isLoading) {
		return (
			<div className="p-6">
				<p className="text-muted-foreground">Loading…</p>
			</div>
		);
	}

	return (
		<div className="h-full overflow-auto">
			<PageHeader
				overline="Fundraising / Campaigns"
				title="Edit campaign"
				subtitle="Items are managed from the campaign detail page after saving."
				action={
					<Button
						variant="tertiary"
						onClick={() => router.push(`/${tenantSlug}/admin/campaigns/${id}`)}
					>
						Back to campaign
					</Button>
				}
			/>
			<CampaignForm
				onSubmit={onSubmit}
				onCancel={() => router.push(`/${tenantSlug}/admin/campaigns/${id}`)}
				initialValues={initialValues}
				submitLabel="Save changes"
				itemsEditable={false}
			/>
		</div>
	);
};
