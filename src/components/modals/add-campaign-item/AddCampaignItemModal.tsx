"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormDatePicker, FormInput } from "@/components/formElements";
import { useAddCampaignItem } from "@/lib/api/campaigns";
import dayjs from "@/lib/dayjs";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	type AddCampaignItemFormValues,
	addCampaignItemDefaults,
	addCampaignItemSchema,
} from "./formHelpers";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"add-campaign-item": AddCampaignItemProps;
	}
}

export type AddCampaignItemProps = {
	tenantSlug: string;
	campaignId: string;
	defaultSortOrder?: number;
};

export const AddCampaignItemModal = ({
	tenantSlug,
	campaignId,
	defaultSortOrder,
	onClose,
}: AddCampaignItemProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useAddCampaignItem(tenantSlug);

	const methods = useForm<AddCampaignItemFormValues>({
		defaultValues: addCampaignItemDefaults,
		resolver: zodResolver(addCampaignItemSchema),
		mode: "onBlur",
	});

	const onSubmit = async (values: AddCampaignItemFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug, id: campaignId } },
				body: {
					title: values.title.trim(),
					description: values.description.trim() || undefined,
					targetAmount: Number(values.target),
					deadline: values.deadline
						? dayjs(values.deadline).toISOString()
						: undefined,
					sortOrder: defaultSortOrder ?? 0,
				},
			});
			onClose();
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Failed to add item");
		}
	};

	return (
		<BaseModal
			overline="Campaign"
			title="Add line item"
			size="md"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Add item",
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
				<FormInput inputName="title" label="Title" placeholder="Roofing" />
				<FormInput inputName="description" label="Description (optional)" />
				<div className="grid grid-cols-2 gap-3">
					<FormInput
						inputName="target"
						label="Target amount"
						type="number"
						placeholder="0.00"
					/>
					<FormDatePicker
						inputName="deadline"
						label="Deadline (optional)"
						helper="Inherits campaign deadline if blank"
					/>
				</div>
				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
