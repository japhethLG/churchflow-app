"use client";

import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import { CampaignForm } from "./CampaignForm";
import { type CampaignFormValues } from "./formHelpers";
import { useAddCampaignItem, useCreateCampaign } from "@/lib/api/campaigns";
import { useTenant } from "@/lib/api/tenants";

export const CampaignNewPage = () => {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { data: tenant } = useTenant(tenantSlug);
  const createCampaign = useCreateCampaign(tenantSlug);
  const addItem = useAddCampaignItem(tenantSlug);

  const onSubmit = async (values: CampaignFormValues) => {
    const created = await createCampaign.mutateAsync({
      params: { path: { tenantId: tenantSlug } },
      body: {
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
        status: values.status,
      },
    });

    // Items are created sequentially
    for (const [idx, item] of values.items.entries()) {
      if (!item.title.trim()) continue;
      await addItem.mutateAsync({
        params: { path: { tenantId: tenantSlug, id: created.id } },
        body: {
          title: item.title.trim(),
          description: item.description?.trim() || undefined,
          targetAmount: Number(item.targetAmount),
          deadline: item.deadline ? new Date(item.deadline).toISOString() : undefined,
          sortOrder: idx,
        },
      });
    }

    router.push(`/${tenantSlug}/admin/campaigns/${created.id}`);
  };

  return (
    <div className="h-full overflow-auto">
      <PageHeader
        overline="Fundraising / Campaigns"
        title="New campaign"
        subtitle="Set the goal in line items so members can pledge to specific needs."
        action={
          <Button variant="tertiary" onClick={() => router.push(`/${tenantSlug}/admin/campaigns`)}>
            Back to campaigns
          </Button>
        }
      />
      <CampaignForm
        onSubmit={onSubmit}
        onCancel={() => router.push(`/${tenantSlug}/admin/campaigns`)}
        submitLabel="Create campaign"
      />
    </div>
  );
};
