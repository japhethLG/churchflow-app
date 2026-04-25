"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button, PageHeader } from "@/components/primitives";
import {
  CampaignForm,
  type CampaignFormValue,
} from "@/components/pages/campaigns";
import { useCampaign, useUpdateCampaign } from "@/lib/api/campaigns";
import { nstr } from "@/lib/api";

const toDateInput = (d: unknown): string  => {
  const s = nstr(d);
  if (!s) return "";
  return new Date(s).toISOString().slice(0, 10);
}

export default () => {
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
      // Existing items are surfaced read-only-ish in the form's items
      // array, but item editing happens on the detail page (add/edit/remove
      // each item is a separate API call). We render them here so the user
      // sees what's there, but disable the inline editor.
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
  }

  if (isLoading || !value) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "#888" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
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
        // Items already exist in DB; the detail page is the canonical
        // place to add/remove. Form keeps them visible but read-only.
        itemsEditable={false}
        // Currency is immutable after creation per SPECS §10.4.
        showStatus={true}
        error={error}
      />
    </div>
  );
}
