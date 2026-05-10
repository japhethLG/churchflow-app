"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
	FormAmountInput,
	FormButton,
	FormInput,
	FormOptionGroup,
	FormSelect,
} from "@/components/formElements";
import { Button } from "@/components/primitives/Button";
import { Pill } from "@/components/primitives/Pill";
import { useCampaign, useCampaigns } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";
import { formatCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import type { RecordGiftEntryValues } from "./formHelpers";
import { TYPE_OPTIONS } from "./formHelpers";

export type ExpandedGiftRowProps = {
	tenantSlug: string;
	index: number;
	onDiscard: () => void;
	onSave: () => void;
	onSaveAndAdd: () => void;
};

export const ExpandedGiftRow = ({
	tenantSlug,
	index,
	onDiscard,
	onSave,
	onSaveAndAdd,
}: ExpandedGiftRowProps) => {
	const base = `gifts.${index}` as const;
	const methods = useFormContext<RecordGiftEntryValues>();

	const memberId = useWatch({ name: "memberId" }) as string;
	const amount = useWatch({ name: `${base}.amount` }) as string;
	const campaignId = useWatch({ name: `${base}.campaignId` }) as string;
	const pledgeId = useWatch({ name: `${base}.pledgeId` }) as string;

	// Save buttons are only active once the row has a valid amount (the only
	// required field — type always has a default).
	const rowIsValid = Boolean(amount) && Number(amount) > 0;

	const { data: campaignsData } = useCampaigns(tenantSlug);
	const campaigns = (campaignsData?.items ?? []).filter(
		(c) => c.status === "ACTIVE" || c.id === campaignId,
	);

	const { data: campaignDetail } = useCampaign(
		tenantSlug,
		campaignId,
		Boolean(campaignId),
	);
	const campaignItems = campaignDetail?.items ?? [];

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

	// Subscribe to user-initiated field changes to keep dependent fields in
	// sync. Using methods.watch (not useWatch + an effect-with-deps) means we
	// only react to actual edits — not the stable defaults — so pre-filled
	// pledge/campaign props are preserved on first render.
	useEffect(() => {
		const sub = methods.watch((value, info) => {
			if (!info.name) {
				return;
			}

			if (info.name === "memberId") {
				methods.setValue(`${base}.pledgeId`, "");
				return;
			}

			if (info.name === `${base}.campaignId`) {
				methods.setValue(`${base}.campaignItemId`, "");
				methods.setValue(`${base}.pledgeId`, "");
				return;
			}

			if (info.name === `${base}.pledgeId`) {
				const newPledgeId = (value.gifts?.[index]?.pledgeId ?? "") as string;
				if (!newPledgeId) {
					return;
				}
				const p = pledges.find((x) => x.id === newPledgeId);
				if (!p) {
					return;
				}
				if (p.campaignId !== value.gifts?.[index]?.campaignId) {
					methods.setValue(`${base}.campaignId`, p.campaignId);
				}
				const itemId =
					typeof p.campaignItemId === "string" ? p.campaignItemId : "";
				if (itemId !== (value.gifts?.[index]?.campaignItemId ?? "")) {
					methods.setValue(`${base}.campaignItemId`, itemId);
				}
			}
		});
		return () => sub.unsubscribe();
	}, [methods, base, index, pledges]);

	return (
		<div className="rounded-2xl border-2 border-primary bg-card p-4">
			<div className="mb-3 flex items-center gap-2">
				<span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
					{index + 1}
				</span>
				<span className="font-semibold text-foreground">Gift details</span>
				<Pill active className="!flex-none !px-2 !py-0.5 !text-[11px]">
					Editing
				</Pill>
			</div>

			<div className="flex flex-col gap-3">
				{/* Amount + Type — equal half-columns so neither field is squeezed */}
				<div className="grid grid-cols-2 gap-3">
					<FormAmountInput inputName={`${base}.amount`} label="Amount" />
					<FormOptionGroup
						inputName={`${base}.type`}
						label="Type"
						variant="chip"
						options={TYPE_OPTIONS.map((o) => ({
							value: o.value,
							label: o.label,
						}))}
					/>
				</div>

				{campaigns.length > 0 && (
					<div
						className={cn(
							"grid gap-3",
							campaignId && campaignItems.length > 0
								? "grid-cols-2"
								: "grid-cols-1",
						)}
					>
						<FormSelect
							inputName={`${base}.campaignId`}
							label="Campaign (optional)"
							options={[
								{ value: "", label: "None" },
								...campaigns.map((c) => ({ value: c.id, label: c.title })),
							]}
						/>
						{campaignId && campaignItems.length > 0 && (
							<FormSelect
								inputName={`${base}.campaignItemId`}
								label="Earmark (optional)"
								disabled={Boolean(pledgeId)}
								hint={pledgeId ? "Locked by pledge attribution" : undefined}
								options={[
									{ value: "", label: "Whole campaign" },
									...campaignItems.map((it) => ({
										value: it.id,
										label: it.title,
									})),
								]}
							/>
						)}
					</div>
				)}

				{pledges.length > 0 && (
					<FormSelect
						inputName={`${base}.pledgeId`}
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

				<div className="grid grid-cols-2 gap-3">
					<FormInput
						inputName={`${base}.referenceNumber`}
						label="Reference # (optional)"
						placeholder="CHK-1402"
					/>
					<FormInput
						inputName={`${base}.note`}
						label="Note (optional)"
						placeholder="e.g. Sunday Worship"
					/>
				</div>
			</div>

			<div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
				<Button variant="tertiary" onClick={onDiscard}>
					Discard
				</Button>
				<FormButton
					type="button"
					variant="secondary"
					disabled={!rowIsValid}
					onClick={onSave}
				>
					Save gift
				</FormButton>
				<FormButton
					type="button"
					variant="primary"
					disabled={!rowIsValid}
					onClick={onSaveAndAdd}
				>
					Save &amp; add another
				</FormButton>
			</div>
		</div>
	);
};
