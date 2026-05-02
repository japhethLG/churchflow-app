"use client";

import { useEffect, useState } from "react";
import dayjs from "@/lib/dayjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormAmountInput,
  FormInput,
  FormMemberPicker,
  FormOptionGroup,
  FormSelect,
  FormDatePicker,
} from "@/components/formElements";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format-currency";
import { useCampaign, useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { usePledges } from "@/lib/api/pledges";
import { useCreateTransaction } from "@/lib/api/transactions";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import {
  buildRecordGiftDefaults,
  recordGiftSchema,
  TYPE_OPTIONS,
  type RecordGiftFormValues,
} from "./formHelpers";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "record-gift": RecordGiftProps;
  }
}

export type RecordGiftProps = {
  tenantSlug: string;
  defaultMemberId?: string;
  defaultCampaignId?: string;
  defaultPledgeId?: string;
};

export const RecordGiftModal = ({
  tenantSlug,
  defaultMemberId,
  defaultCampaignId,
  defaultPledgeId,
  onClose,
}: RecordGiftProps & ModalBaseProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { data: membersData } = useMembers(tenantSlug, { limit: 200 });
  const { data: campaignsData } = useCampaigns(tenantSlug);
  const { mutateAsync, isPending } = useCreateTransaction(tenantSlug);

  const methods = useForm<RecordGiftFormValues>({
    defaultValues: buildRecordGiftDefaults({
      defaultMemberId,
      defaultCampaignId,
      defaultPledgeId,
    }),
    resolver: zodResolver(recordGiftSchema),
    mode: "onBlur",
  });

  const memberId = methods.watch("memberId");
  const campaignId = methods.watch("campaignId");
  const campaignItemId = methods.watch("campaignItemId");
  const pledgeId = methods.watch("pledgeId");

  const members = membersData?.items ?? [];
  const campaigns = (campaignsData?.items ?? []).filter(
    (c) => c.status === "ACTIVE" || c.id === campaignId,
  );

  const { data: campaignDetail } = useCampaign(tenantSlug, campaignId, Boolean(campaignId));
  const campaignItems = campaignDetail?.items ?? [];

  const { data: pledgesData } = usePledges(
    tenantSlug,
    { memberId, status: "ACTIVE", campaignId: campaignId || undefined, limit: 20 },
    Boolean(memberId),
  );
  const pledges = pledgesData?.items ?? [];

  // When campaign changes, drop dependent fields.
  useEffect(() => {
    const sub = methods.watch((_, { name }) => {
      if (name === "campaignId") {
        methods.setValue("campaignItemId", "");
        methods.setValue("pledgeId", "");
      }
      if (name === "memberId") {
        methods.setValue("pledgeId", "");
      }
    });
    return () => sub.unsubscribe();
  }, [methods]);

  // When a pledge is selected, sync the campaign + item to match it.
  useEffect(() => {
    if (!pledgeId) return;
    const p = pledges.find((x) => x.id === pledgeId);
    if (!p) return;
    if (p.campaignId !== campaignId) {
      methods.setValue("campaignId", p.campaignId);
    }
    const itemId = typeof p.campaignItemId === "string" ? p.campaignItemId : "";
    if (itemId !== campaignItemId) {
      methods.setValue("campaignItemId", itemId);
    }
  }, [pledgeId, pledges, campaignId, campaignItemId, methods]);

  const onSubmit = async (values: RecordGiftFormValues) => {
    setSubmitError(null);
    try {
      await mutateAsync({
        params: { path: { tenantId: tenantSlug } },
        body: {
          type: values.type,
          amount: Number(values.amount),
          date: dayjs(values.date).toISOString(),
          memberId: values.memberId || undefined,
          campaignId: values.campaignId || undefined,
          campaignItemId: values.campaignItemId || undefined,
          pledgeId: values.pledgeId || undefined,
          note: values.note.trim() || undefined,
          referenceNumber: values.referenceNumber.trim() || undefined,
        },
      });
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not record gift");
    }
  };

  return (
    <BaseModal
      overline="New entry"
      title="Record a gift"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      footerHint="⌘ Enter to record · Esc to cancel"
      primaryAction={{
        label: "Record gift",
        onClick: methods.handleSubmit(onSubmit),
        loading: isPending,
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <Form methods={methods} onSubmit={onSubmit} className="gap-5">
        <FormAmountInput
          inputName="amount"
          label="Amount"
          autoFocus
        />

        <FormOptionGroup
          inputName="type"
          label="Type"
          variant="chip"
          options={TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
        />

        <div className="grid grid-cols-2 gap-3.5">
          <FormDatePicker inputName="date" label="Date" />
          <FormMemberPicker
            inputName="memberId"
            label="Member"
            members={members}
            variant="dropdown"
            placeholder="Search or leave blank for anonymous"
          />
        </div>

        {campaigns.length > 0 && (
          <div
            className={cn(
              "grid gap-3.5",
              campaignId && campaignItems.length > 0 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            <FormSelect
              inputName="campaignId"
              label="Campaign (optional)"
              options={[
                { value: "", label: "None" },
                ...campaigns.map((c) => ({ value: c.id, label: c.title })),
              ]}
            />
            {campaignId && campaignItems.length > 0 && (
              <FormSelect
                inputName="campaignItemId"
                label="Earmark (optional)"
                disabled={Boolean(pledgeId)}
                hint={pledgeId ? "Locked by pledge attribution" : undefined}
                options={[
                  { value: "", label: "Whole campaign" },
                  ...campaignItems.map((it) => ({ value: it.id, label: it.title })),
                ]}
              />
            )}
          </div>
        )}

        {pledges.length > 0 && (
          <FormSelect
            inputName="pledgeId"
            label="Against pledge (optional)"
            options={[
              { value: "", label: "Don't link a pledge" },
              ...pledges.map((p) => ({
                value: p.id,
                label: `${formatCurrency(p.pledgedAmount)} pledge${
                  p.campaignItemId ? " · earmarked" : ""
                }`,
              })),
            ]}
          />
        )}

        <div className="grid grid-cols-2 gap-3.5">
          <FormInput
            inputName="referenceNumber"
            label="Reference # (optional)"
            placeholder="CHK-1402"
          />
          <FormInput
            inputName="note"
            label="Note (optional)"
            placeholder="e.g. Sunday Worship"
          />
        </div>

        {submitError && <p className="m-0 text-sm text-destructive">{submitError}</p>}
      </Form>
    </BaseModal>
  );
};
