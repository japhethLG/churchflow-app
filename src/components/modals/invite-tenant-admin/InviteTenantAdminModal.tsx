"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormInput } from "@/components/formElements";
import { useIssueInvitation } from "@/lib/api/invitations";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	type InviteTenantAdminFormValues,
	inviteTenantAdminSchema,
} from "./formHelpers";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"invite-tenant-admin": InviteTenantAdminProps;
	}
}

export type InviteTenantAdminProps = {
	tenantId: string;
	tenantName: string;
};

export const InviteTenantAdminModal = ({
	tenantId,
	tenantName,
	onClose,
}: InviteTenantAdminProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [sentTo, setSentTo] = useState<string | null>(null);
	const { mutateAsync, isPending } = useIssueInvitation();

	const methods = useForm<InviteTenantAdminFormValues>({
		defaultValues: { email: "" },
		resolver: zodResolver(inviteTenantAdminSchema),
		mode: "onBlur",
	});

	const onSubmit = async (values: InviteTenantAdminFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId } },
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
					An invitation has been sent to <strong>{sentTo}</strong>. They&apos;ll
					join {tenantName} as an admin once they accept.
				</p>
			</BaseModal>
		);
	}

	return (
		<BaseModal
			overline={tenantName}
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
				<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
					The invited user will receive a link to join {tenantName} as an admin.
				</p>
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
