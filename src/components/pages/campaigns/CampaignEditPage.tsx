"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import { CampaignForm, type CampaignFormValue } from "./CampaignForm";
import { useCampaign, useUpdateCampaign } from "@/lib/api/campaigns";
import { nstr } from "@/lib/api";

const toDateInput = (d: unknown): string => {
  const s = nstr(d);
  if (!s) return "";
  return new Date(s).toISOString().slice(0, 10);
};

export const CampaignEditPage = () => {
  const router = useRouter();
  const { tenantSlug, id } = useParams<{ tenantSlug: string; id: string }>();
  const { data: campaign, isLoading } = useCampaign(tenantSlug, id);
  const updateCampaign = useUpdateCampaign(tenantSlug);

  const [value, setValue] = useState<CampaignFormValue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!campaign) return;
    setValue({
      title: campaign.title,
      description: nstr(campaign.description) ?? "",
      currency: campaign.currency,
      deadline: toDateInput(campaign.deadline),
      status: campaign.status,
      items: campaign.items.map((i, idx) => ({
        tempId: `existing-${idx}`,
        id: i.id,
        title: i.title,
        description: nstr(i.description) ?? "",
        targetAmount: i.targetAmount.toString(),
        deadline: toDateInput(i.deadline),
      })),
    });
  }, [campaign]);

  const handleSubmit = async () => {
    if (!value) return;
    setError(null);
    setSubmitting(true);
    try {
      await updateCampaign.mutateAsync({
        params: { path: { tenantId: tenantSlug, id } },
        body: {
          title: value.title.trim(),
          description: value.description.trim() || undefined,
          deadline: value.deadline ? new Date(value.deadline).toISOString() : undefined,
          status: value.status,
        },
      });
      router.push(`/${tenantSlug}/admin/campaigns/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update campaign");
      setSubmitting(false);
    }
  };

  if (isLoading || !value) {
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
          <Button variant="tertiary" onClick={() => router.push(`/${tenantSlug}/admin/campaigns/${id}`)}>
            Back to campaign
          </Button>
        }
      />
      <CampaignForm
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/${tenantSlug}/admin/campaigns/${id}`)}
        submitting={submitting}
        submitLabel="Save changes"
        itemsEditable={false}
        showStatus={true}
        error={error}
      />
    </div>
  );
}
