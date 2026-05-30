"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
	Form,
	FormInput,
	FormMemberPicker,
	FormOptionGroup,
	FormSelect,
} from "@/components/formElements";
import { Button } from "@/components/primitives/Button";
import { BaseSheet } from "@/components/sheets/BaseSheet";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useCreateMyPledge, useCreatePledge } from "@/lib/api/pledges";
import { formatAmount } from "@/lib/format-currency";
import type { SheetBaseProps } from "@/lib/sheets/registry";
import {
	buildPledgeSheetDefaults,
	type PledgeSheetValues,
	pledgeSheetSchema,
} from "./formHelpers";

type Campaign = components["schemas"]["CampaignResponseDto"];
type Item = components["schemas"]["CampaignItemResponseDto"];

export type PledgeSheetProps = {
	tenantSlug: string;
	/**
	 * "self" → member pledges for themselves (`/me/pledges`, no member picker).
	 * "tenant" → admin records a pledge for any member (member picker shown).
	 */
	intent: "self" | "tenant";
	campaignId: string;
	campaignTitle: string;
	items: Item[];
	/** Pre-selected member for the tenant intent. */
	defaultMemberId?: string;
};

declare module "@/lib/sheets/registry" {
	interface SheetPropsMap {
		pledge: PledgeSheetProps;
	}
}

/**
 * Mobile bottom-sheet counterpart to the pledge modals — one component for
 * both intents. The member (self) variant fixes the campaign and hides the
 * member picker; the admin (tenant) variant adds a member picker and a
 * campaign switcher. Mirrors `CreatePledgeModal` / `MemberPledgeModal`.
 */
export const PledgeSheet = ({
	open,
	onOpenChange,
	onOpenChangeComplete,
	tenantSlug,
	intent,
	campaignId,
	campaignTitle,
	items,
	defaultMemberId,
}: SheetBaseProps & PledgeSheetProps) => {
	const isTenant = intent === "tenant";
	const [submitError, setSubmitError] = useState<string | null>(null);

	// Both mutations are instantiated unconditionally (rules-of-hooks); only the
	// one matching the intent is ever fired.
	const selfM = useCreateMyPledge(tenantSlug);
	const tenantM = useCreatePledge(tenantSlug);
	const isPending = isTenant ? tenantM.isPending : selfM.isPending;

	// Admin-only lookups — gated off for the self intent (a member can't read
	// the tenant-wide member/campaign lists).
	const { data: membersData } = useMembers(
		tenantSlug,
		{ limit: 200 },
		isTenant,
	);
	const { data: campaignsData } = useCampaigns(tenantSlug, {}, isTenant);
	const members = membersData?.items ?? [];
	const campaigns: Campaign[] = campaignsData?.items ?? [];

	const methods = useForm<PledgeSheetValues>({
		defaultValues: buildPledgeSheetDefaults(campaignId, defaultMemberId),
		resolver: zodResolver(pledgeSheetSchema(intent)),
		mode: "onBlur",
	});

	// Items are only known for the campaign passed in props; switching campaigns
	// (admin) clears the item until the new campaign's items are available.
	const chosenCampaignId = methods.watch("campaignId");
	const itemsForCampaign: Item[] = chosenCampaignId === campaignId ? items : [];

	useEffect(() => {
		const sub = methods.watch((_, { name }) => {
			if (name === "campaignId") {
				methods.setValue("itemId", "");
			}
		});
		return () => sub.unsubscribe();
	}, [methods]);

	const itemOptions = useMemo(
		() => [
			{ value: "", label: "Whole campaign" },
			...itemsForCampaign.map((item) => ({
				value: item.id,
				label: item.title,
				description: `Goal: ${formatAmount(item.targetAmount)}`,
			})),
		],
		[itemsForCampaign],
	);

	const onSubmit = async (values: PledgeSheetValues) => {
		setSubmitError(null);
		try {
			if (isTenant) {
				await tenantM.mutateAsync({
					params: { path: { tenantId: tenantSlug } },
					body: {
						campaignId: values.campaignId,
						campaignItemId: values.itemId || undefined,
						memberId: values.memberId,
						pledgedAmount: Number(values.amount),
						note: values.note.trim() || undefined,
					},
				});
			} else {
				await selfM.mutateAsync({
					params: { path: { tenantId: tenantSlug } },
					body: {
						campaignId,
						campaignItemId: values.itemId || undefined,
						pledgedAmount: Number(values.amount),
						note: values.note.trim() || undefined,
					},
				});
			}
			onOpenChange(false);
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Could not create pledge",
			);
		}
	};

	return (
		<BaseSheet
			open={open}
			onOpenChange={onOpenChange}
			onOpenChangeComplete={onOpenChangeComplete}
			initialSnap={1}
			title={isTenant ? "New pledge" : "Make a pledge"}
			description={campaignTitle}
			footer={
				<div className="flex items-center gap-2">
					<Button
						role="secondary"
						recipe="outline"
						onClick={() => onOpenChange(false)}
						disabled={isPending}
						className="flex-1"
					>
						Cancel
					</Button>
					<Button
						role="primary"
						recipe="gradient"
						onClick={methods.handleSubmit(onSubmit)}
						loading={isPending}
						className="flex-[1.5]"
					>
						{isTenant ? "Create pledge" : "Pledge"}
					</Button>
				</div>
			}
		>
			<Form methods={methods} onSubmit={onSubmit}>
				{isTenant && campaigns.length > 1 && (
					<FormSelect
						inputName="campaignId"
						label="Campaign"
						options={campaigns.map((c) => ({ value: c.id, label: c.title }))}
					/>
				)}

				{itemsForCampaign.length > 0 && (
					<FormOptionGroup
						inputName="itemId"
						label="Pledge toward"
						variant="row"
						options={itemOptions}
					/>
				)}

				{isTenant && (
					<FormMemberPicker
						inputName="memberId"
						label="Member"
						members={members}
						variant="dropdown"
						placeholder="Search by name or email…"
					/>
				)}

				<FormInput
					inputName="amount"
					label="Pledged amount"
					type="number"
					placeholder="0.00"
				/>

				<FormInput
					inputName="note"
					label="Note (optional)"
					placeholder="e.g. paying over 6 months"
				/>

				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseSheet>
	);
};
