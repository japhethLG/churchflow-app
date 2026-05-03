"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormInput, FormOptionGroup } from "@/components/formElements";
import type { components } from "@/lib/api";
import { useCreateMyPledge } from "@/lib/api/pledges";
import { formatAmount } from "@/lib/format-currency";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	type MemberPledgeFormValues,
	memberPledgeDefaults,
	memberPledgeSchema,
} from "./formHelpers";

type Item = components["schemas"]["CampaignItemResponseDto"];

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"member-pledge": MemberPledgeProps;
	}
}

export type MemberPledgeProps = {
	tenantSlug: string;
	campaignId: string;
	campaignTitle: string;
	items: Item[];
};

export const MemberPledgeModal = ({
	tenantSlug,
	campaignId,
	campaignTitle,
	items,
	onClose,
}: MemberPledgeProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	// Self intent — backend forces memberId to the authenticated caller
	// regardless of what the body sends.
	const { mutateAsync, isPending } = useCreateMyPledge(tenantSlug);

	const methods = useForm<MemberPledgeFormValues>({
		defaultValues: memberPledgeDefaults,
		resolver: zodResolver(memberPledgeSchema),
		mode: "onBlur",
	});

	const itemOptions = [
		{ value: "", label: "Whole campaign" },
		...items.map((item) => ({
			value: item.id,
			label: item.title,
			description: `Goal: ${formatAmount(item.targetAmount)}`,
		})),
	];

	const onSubmit = async (values: MemberPledgeFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug } },
				body: {
					campaignId,
					campaignItemId: values.itemId || undefined,
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
			overline="Make a pledge"
			title={campaignTitle}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Pledge",
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
				{items.length > 0 && (
					<FormOptionGroup
						inputName="itemId"
						label="Pledge toward"
						variant="row"
						options={itemOptions}
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
		</BaseModal>
	);
};
