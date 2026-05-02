"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormInput, FormSelect } from "@/components/formElements";
import { useIssueInvitation } from "@/lib/api/invitations";
import { useTenants } from "@/lib/api/tenants";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	type InviteAdminGlobalFormValues,
	inviteAdminGlobalDefaults,
	inviteAdminGlobalSchema,
} from "./formHelpers";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"invite-admin-global": InviteAdminGlobalProps;
	}
}

export type InviteAdminGlobalProps = Record<string, never>;

export const InviteAdminGlobalModal = ({
	onClose,
}: InviteAdminGlobalProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [sentTo, setSentTo] = useState<string | null>(null);
	const { data: tenantsData } = useTenants();
	const { mutateAsync, isPending } = useIssueInvitation();

	const tenants = tenantsData?.items ?? [];
	const tenantOptions = tenants
		.filter((t) => !t.deletedAt)
		.map((t) => ({ value: t.id, label: t.name }));

	const methods = useForm<InviteAdminGlobalFormValues>({
		defaultValues: inviteAdminGlobalDefaults,
		resolver: zodResolver(inviteAdminGlobalSchema),
		mode: "onBlur",
	});

	const onSubmit = async (values: InviteAdminGlobalFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: values.tenantId } },
				body: { email: values.email.trim(), role: "ADMIN" },
			});
			setSentTo(values.email.trim());
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Failed to send invite",
			);
		}
	};

	if (sentTo) {
		return (
			<BaseModal
				overline="Invitation sent"
				title="Invite sent"
				size="sm"
				onClose={onClose}
				primaryAction={{ label: "Done", onClick: onClose }}
			>
				<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
					Invite sent to <strong>{sentTo}</strong>.
				</p>
			</BaseModal>
		);
	}

	return (
		<BaseModal
			overline="Platform"
			title="Invite admin"
			size="md"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Send invite",
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
				<FormSelect
					inputName="tenantId"
					label="Church"
					placeholder="Select a church…"
					options={tenantOptions}
				/>
				<FormInput
					inputName="email"
					label="Email address"
					type="email"
					placeholder="admin@example.com"
				/>
				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
