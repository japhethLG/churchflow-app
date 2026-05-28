"use client";

import { useEffect, useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
	FormAmountInput,
	FormInput,
	FormOptionGroup,
	FormSelect,
} from "@/components/formElements";
import {
	type RecordGiftEntryValues,
	TYPE_OPTIONS,
} from "@/components/modals/record-gift/formHelpers";
import { useCampaign, useCampaigns } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";
import { formatCurrency } from "@/lib/format-currency";

const BASE = "draft" as const;

/**
 * Mobile add-gift form body — same cascading-select logic as
 * `GiftEditor`, minus the card chrome. Lives directly in the sheet body.
 */
export const MobileGiftFields = ({ tenantSlug }: { tenantSlug: string }) => {
	const methods = useFormContext<RecordGiftEntryValues>();

	const memberId = useWatch({ name: "memberId" }) as string;
	const campaignId = useWatch({ name: `${BASE}.campaignId` }) as string;
	const pledgeId = useWatch({ name: `${BASE}.pledgeId` }) as string;

	const { data: campaignsData } = useCampaigns(tenantSlug);
	const { data: campaignDetail } = useCampaign(tenantSlug, campaignId, {
		enabled: Boolean(campaignId),
	});
	const campaignItems = campaignDetail?.items ?? [];

	const campaigns = useMemo(() => {
		const base = (campaignsData?.items ?? []).filter(
			(c) => c.status === "ACTIVE" || c.id === campaignId,
		);
		if (
			campaignId &&
			campaignDetail &&
			!base.some((c) => c.id === campaignId)
		) {
			return [...base, campaignDetail];
		}
		return base;
	}, [campaignsData, campaignDetail, campaignId]);
	const campaignsEmpty = campaigns.length === 0;

	const { data: pledgesData } = usePledges(
		tenantSlug,
		{
			memberId,
			status: "ACTIVE",
			campaignId: campaignId || undefined,
			limit: 20,
		},
		Boolean(memberId),
	);
	const pledges = pledgesData?.items ?? [];

	const earmarkDisabled =
		!campaignId || campaignItems.length === 0 || Boolean(pledgeId);
	const earmarkHint = pledgeId
		? "Locked by pledge attribution"
		: !campaignId
			? "Select a campaign first"
			: campaignItems.length === 0
				? "This campaign has no earmarks"
				: undefined;

	const pledgeDisabled = !memberId || pledges.length === 0;
	const pledgeHint = !memberId
		? "Select a member to link a pledge"
		: pledges.length === 0
			? "No active pledges for this member"
			: undefined;

	// Mirror GiftEditor's cascade: keep pledge/earmark consistent with the
	// chosen campaign and member.
	useEffect(() => {
		const sub = methods.watch((value, info) => {
			if (!info.name) {
				return;
			}
			if (info.name === "memberId") {
				methods.setValue(`${BASE}.pledgeId`, "");
				return;
			}
			if (info.name === `${BASE}.campaignId`) {
				const nextCampaignId = (value.draft?.campaignId ?? "") as string;
				const currentPledgeId = (value.draft?.pledgeId ?? "") as string;
				const linkedPledge = currentPledgeId
					? pledges.find((p) => p.id === currentPledgeId)
					: undefined;
				if (linkedPledge && linkedPledge.campaignId === nextCampaignId) {
					return;
				}
				methods.setValue(`${BASE}.campaignItemId`, "");
				methods.setValue(`${BASE}.pledgeId`, "");
				return;
			}
			if (info.name === `${BASE}.pledgeId`) {
				const newPledgeId = (value.draft?.pledgeId ?? "") as string;
				if (!newPledgeId) {
					return;
				}
				const p = pledges.find((x) => x.id === newPledgeId);
				if (!p) {
					return;
				}
				if (p.campaignId !== value.draft?.campaignId) {
					methods.setValue(`${BASE}.campaignId`, p.campaignId);
				}
				const itemId =
					typeof p.campaignItemId === "string" ? p.campaignItemId : "";
				if (itemId !== (value.draft?.campaignItemId ?? "")) {
					methods.setValue(`${BASE}.campaignItemId`, itemId);
				}
			}
		});
		return () => sub.unsubscribe();
	}, [methods, pledges]);

	return (
		<div className="flex flex-col gap-4">
			<FormAmountInput inputName={`${BASE}.amount`} label="Amount" />
			<FormOptionGroup
				inputName={`${BASE}.type`}
				label="Type"
				variant="chip"
				options={TYPE_OPTIONS.map((o) => ({
					value: o.value,
					label: o.label,
				}))}
			/>
			<FormSelect
				inputName={`${BASE}.pledgeId`}
				label="Against pledge (optional)"
				disabled={pledgeDisabled}
				hint={pledgeHint}
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
			<FormSelect
				inputName={`${BASE}.campaignId`}
				label="Campaign (optional)"
				disabled={campaignsEmpty}
				hint={campaignsEmpty ? "No active campaigns" : undefined}
				options={[
					{ value: "", label: "None" },
					...campaigns.map((c) => ({ value: c.id, label: c.title })),
				]}
			/>
			<FormSelect
				inputName={`${BASE}.campaignItemId`}
				label="Earmark (optional)"
				disabled={earmarkDisabled}
				hint={earmarkHint}
				options={[
					{ value: "", label: "Whole campaign" },
					...campaignItems.map((it) => ({ value: it.id, label: it.title })),
				]}
			/>
			<FormInput
				inputName={`${BASE}.referenceNumber`}
				label="Reference # (optional)"
				placeholder="CHK-1402"
			/>
			<FormInput
				inputName={`${BASE}.note`}
				label="Note (optional)"
				placeholder="e.g. Sunday Worship"
			/>
		</div>
	);
};
