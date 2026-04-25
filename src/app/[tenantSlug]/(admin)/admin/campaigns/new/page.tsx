"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import {
  CampaignForm,
  newItemDraft,
  type CampaignFormValue,
} from "@/components/pages/campaigns";
import { useAddCampaignItem, useCreateCampaign } from "@/lib/api/campaigns";
import { useTenant } from "@/lib/api/tenants";

export default function NewCampaignPage() {
  const router = useRouter();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { data: tenant } = useTenant(tenantSlug);
  const createCampaign = useCreateCampaign(tenantSlug);
  const addItem = useAddCampaignItem(tenantSlug);

  const [value, setValue] = useState<CampaignFormValue>({
    title: "",
    description: "",
    currency: "",
    deadline: "",
    status: "DRAFT",
    items: [newItemDraft()],
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Default currency to the tenant's currency once it loads. Don't clobber
  // a manual edit — only fill in if the field is still empty.
  useEffect(() => {
    if (!tenant?.currency) return;
    setValue((v) => (v.currency ? v : { ...v, currency: tenant.currency }));
  }, [tenant?.currency]);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const created = await createCampaign.mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          title: value.title.trim(),
          description: value.description.trim() || undefined,
          currency: value.currency.trim().toUpperCase(),
          deadline: value.deadline ? new Date(value.deadline).toISOString() : undefined,
          status: value.status,
        },
      });

      // Items are created sequentially so a failure surfaces against the
      // right item — admins typically have <10 here.
      for (const [idx, item] of value.items.entries()) {
        if (!item.title.trim()) continue;
        await addItem.mutateAsync({
          params: { path: { tenantId: tenantSlug, id: created.id } },
          body: {
            title: item.title.trim(),
            description: item.description.trim() || undefined,
            targetAmount: Number(item.targetAmount),
            deadline: item.deadline ? new Date(item.deadline).toISOString() : undefined,
            sortOrder: idx,
          },
        });
      }

      router.push(`/${tenantSlug}/admin/campaigns/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create campaign");
      setSubmitting(false);
    }
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
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
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${tenantSlug}/admin/campaigns`)}
        submitting={submitting}
        submitLabel="Create campaign"
        error={error}
      />
    </div>
  );
}
