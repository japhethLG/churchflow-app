"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
	Form,
	FormAmountInput,
	FormOptionGroup,
	FormTextArea,
} from "@/components/formElements";
import { type components, nstr } from "@/lib/api";
import { useCampaign } from "@/lib/api/campaigns";
import { useMembers } from "@/lib/api/members";
import { useUpdatePledge } from "@/lib/api/pledges";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	buildEditPledgeDefaults,
	type EditPledgeFormValues,
	editPledgeSchema,
	STATUS_OPTIONS,
} from "./formHelpers";

type Pledge = components["schemas"]["PledgeResponseDto"];

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"edit-pledge": EditPledgeProps;
	}
}

export type EditPledgeProps = {
	tenantSlug: string;
	pledge: Pledge;
};

export const EditPledgeModal = ({
	tenantSlug,
	pledge,
	onClose,
}: EditPledgeProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useUpdatePledge(tenantSlug);

	const { data: campaign } = useCampaign(tenantSlug, pledge.campaignId, {
		includeDeleted: true,
	});
	const { data: membersData } = useMembers(tenantSlug, {
		limit: 500,
		includeDeleted: true,
	});
	const member = membersData?.items.find((m) => m.id === pledge.memberId);

	const itemId = nstr(pledge.campaignItemId);
	const earmarkedItem =
		itemId && campaign?.items
			? campaign.items.find((it) => it.id === itemId)
			: undefined;

	const methods = useForm<EditPledgeFormValues>({
		defaultValues: buildEditPledgeDefaults(pledge),
		resolver: zodResolver(editPledgeSchema),
		mode: "onBlur",
	});

	const onSubmit = async (values: EditPledgeFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug, id: pledge.id } },
				body: {
					pledgedAmount: Number(values.amount),
					status: values.status,
					note: values.note.trim() || undefined,
				},
			});
			onClose();
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Failed to update pledge",
			);
		}
	};

	const memberName = member
		? `${member.firstName} ${member.lastName}`.trim() || "Unnamed"
		: "—";

	return (
		<BaseModal
			title="Edit pledge"
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
			<div className="mb-4 rounded-lg bg-muted/40 px-4 py-3 text-sm">
				<div className="text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
					Pledge
				</div>
				<div className="mt-1 text-foreground">
					<span className="font-medium">{memberName}</span>
					<span className="text-muted-foreground"> · </span>
					<span>{campaign?.title ?? "—"}</span>
				</div>
				{earmarkedItem && (
					<div className="mt-0.5 text-xs text-muted-foreground">
						Earmarked to {earmarkedItem.title}
					</div>
				)}
			</div>

			<Form methods={methods} onSubmit={onSubmit}>
				<FormAmountInput inputName="amount" label="Pledged amount" />
				<FormOptionGroup
					inputName="status"
					label="Status"
					variant="card"
					options={STATUS_OPTIONS.map((o) => ({
						value: o.value,
						label: o.label,
						description: o.description,
					}))}
				/>
				<FormTextArea
					inputName="note"
					label="Note (optional)"
					rows={3}
					placeholder="e.g. paying over 6 months"
				/>
				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
