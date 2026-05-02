"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
	Form,
	FormInput,
	FormMemberPicker,
	FormSelect,
} from "@/components/formElements";
import type { components } from "@/lib/api";
import { useCampaigns } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useCreatePledge } from "@/lib/api/pledges";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	buildCreatePledgeDefaults,
	type CreatePledgeFormValues,
	createPledgeSchema,
} from "./formHelpers";

type Campaign = components["schemas"]["CampaignResponseDto"];
type Item = components["schemas"]["CampaignItemResponseDto"];

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"create-pledge": CreatePledgeProps;
	}
}

export type CreatePledgeProps = {
	tenantSlug: string;
	campaignId: string;
	campaignTitle: string;
	items: Item[];
	defaultMemberId?: string;
};

export const CreatePledgeModal = ({
	tenantSlug,
	campaignId,
	campaignTitle,
	items,
	defaultMemberId,
	onClose,
}: CreatePledgeProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const { data: membersData } = useMembers(tenantSlug, { limit: 200 });
	const { data: campaignsData } = useCampaigns(tenantSlug);
	const { mutateAsync, isPending } = useCreatePledge(tenantSlug);

	const members = membersData?.items ?? [];
	const campaigns: Campaign[] = campaignsData?.items ?? [];

	const methods = useForm<CreatePledgeFormValues>({
		defaultValues: buildCreatePledgeDefaults(campaignId, defaultMemberId),
		resolver: zodResolver(createPledgeSchema),
		mode: "onBlur",
	});

	const chosenCampaignId = methods.watch("campaignId");
	const itemsForCampaign: Item[] = chosenCampaignId === campaignId ? items : [];

	useEffect(() => {
		const sub = methods.watch((_, { name }) => {
			if (name === "campaignId") methods.setValue("itemId", "");
		});
		return () => sub.unsubscribe();
	}, [methods]);

	const onSubmit = async (values: CreatePledgeFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug } },
				body: {
					campaignId: values.campaignId,
					campaignItemId: values.itemId || undefined,
					memberId: values.memberId,
					pledgedAmount: Number(values.amount),
					note: values.note.trim() || undefined,
				},
			});
			onClose();
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Could not create pledge",
			);
		}
	};

	return (
		<BaseModal
			overline="Pledge"
			title={`New pledge — ${campaignTitle}`}
			size="md"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Create pledge",
				onClick: methods.handleSubmit(onSubmit),
				loading: isPending,
			}}
			secondaryAction={{
				label: "Cancel",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<Form methods={methods} onSubmit={onSubmit}>
				{campaigns.length > 1 && (
					<FormSelect
						inputName="campaignId"
						label="Campaign"
						options={campaigns.map((c) => ({ value: c.id, label: c.title }))}
					/>
				)}

				{itemsForCampaign.length > 0 && (
					<FormSelect
						inputName="itemId"
						label="Campaign item"
						options={[
							{ value: "", label: "Whole campaign" },
							...itemsForCampaign.map((i) => ({ value: i.id, label: i.title })),
						]}
					/>
				)}

				<FormMemberPicker
					inputName="memberId"
					label="Member"
					members={members}
					variant="inline"
					placeholder="Search by name or email…"
				/>

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
		</BaseModal>
	);
};
