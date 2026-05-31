"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormDatePicker, FormInput } from "@/components/formElements";
import type { components } from "@/lib/api";
import { useUpdateCampaignItem } from "@/lib/api/campaigns";
import { toUtcDayStart } from "@/lib/dayjs";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	buildEditCampaignItemDefaults,
	type EditCampaignItemFormValues,
	editCampaignItemSchema,
} from "./formHelpers";

type Item = components["schemas"]["CampaignItemResponseDto"];

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"edit-campaign-item": EditCampaignItemProps;
	}
}

export type EditCampaignItemProps = {
	tenantSlug: string;
	campaignId: string;
	item: Item;
};

export const EditCampaignItemModal = ({
	tenantSlug,
	campaignId,
	item,
	onClose,
}: EditCampaignItemProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useUpdateCampaignItem(tenantSlug);

	const methods = useForm<EditCampaignItemFormValues>({
		defaultValues: buildEditCampaignItemDefaults(item),
		resolver: zodResolver(editCampaignItemSchema),
		mode: "onBlur",
	});

	const onSubmit = async (values: EditCampaignItemFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: {
					path: { tenantId: tenantSlug, id: campaignId, itemId: item.id },
				},
				body: {
					title: values.title.trim(),
					description: values.description.trim() || undefined,
					targetAmount: Number(values.target),
					deadline: values.deadline
						? toUtcDayStart(values.deadline)
						: undefined,
				},
			});
			onClose();
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Failed to update item",
			);
		}
	};

	return (
		<BaseModal
			overline="Campaign"
			title="Edit line item"
			size="md"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Save",
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
				<FormInput inputName="title" label="Title" />
				<FormInput inputName="description" label="Description (optional)" />
				<div className="grid grid-cols-2 gap-3">
					<FormInput inputName="target" label="Target amount" type="number" />
					<FormDatePicker inputName="deadline" label="Deadline" />
				</div>
				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
