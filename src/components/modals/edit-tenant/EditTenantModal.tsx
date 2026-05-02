"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormInput, FormTextArea } from "@/components/formElements";
import { useUpdateTenant } from "@/lib/api/tenants";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	buildDefaultValues,
	type EditTenantFormValues,
	editTenantSchema,
} from "./formHelpers";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"edit-tenant": EditTenantProps;
	}
}

export type EditTenantProps = {
	tenantId: string;
	currentName: string;
	currentDescription?: string | null;
};

export const EditTenantModal = ({
	tenantId,
	currentName,
	currentDescription,
	onClose,
}: EditTenantProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useUpdateTenant();

	const methods = useForm<EditTenantFormValues>({
		defaultValues: buildDefaultValues(currentName, currentDescription),
		resolver: zodResolver(editTenantSchema),
		mode: "onBlur",
	});

	const onSubmit = async (values: EditTenantFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId } },
				body: { name: values.name.trim() },
			});
			onClose();
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Failed to update");
		}
	};

	return (
		<BaseModal
			overline="Church details"
			title="Edit church"
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
				<FormInput inputName="name" label="Church name" />
				<FormTextArea inputName="description" label="Description" rows={3} />
				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
