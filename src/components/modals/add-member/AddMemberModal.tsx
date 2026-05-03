"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormInput } from "@/components/formElements";
import { useCreateMember } from "@/lib/api/members";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	type AddMemberFormValues,
	addMemberDefaults,
	addMemberSchema,
} from "./formHelpers";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"add-member": AddMemberProps;
	}
}

export type AddMemberProps = {
	tenantSlug: string;
};

export const AddMemberModal = ({
	tenantSlug,
	onClose,
}: AddMemberProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useCreateMember(tenantSlug);

	const methods = useForm<AddMemberFormValues>({
		defaultValues: addMemberDefaults,
		resolver: zodResolver(addMemberSchema),
		mode: "onBlur",
	});

	const onSubmit = async (values: AddMemberFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug } },
				body: {
					firstName: values.firstName.trim(),
					lastName: values.lastName.trim(),
					email: values.email.trim() || undefined,
					phone: values.phone.trim() || undefined,
					address: values.address.trim() || undefined,
					role: "USER",
				},
			});
			onClose();
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Failed to add member",
			);
		}
	};

	return (
		<BaseModal
			overline="Directory"
			title="Add member"
			size="md"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Add member",
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
				<p className="m-0 text-sm text-muted-foreground">
					Adds a temp member you can attribute giving to. They can claim the
					profile later — invite them with a sign-in link via{" "}
					<strong>Invite member</strong> instead if they should access
					ChurchFlow themselves.
				</p>
				<div className="grid grid-cols-2 gap-3">
					<FormInput inputName="firstName" label="First name" />
					<FormInput inputName="lastName" label="Last name" />
				</div>
				<FormInput inputName="email" label="Email (optional)" type="email" />
				<FormInput inputName="phone" label="Phone (optional)" />
				<FormInput inputName="address" label="Address (optional)" />
				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
