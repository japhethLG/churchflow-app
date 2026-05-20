"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Form, FormInput } from "@/components/formElements";
import { useRenameTenantSlug } from "@/lib/api/tenants";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	type RenameTenantSlugFormValues,
	renameTenantSlugSchema,
} from "./formHelpers";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"rename-tenant-slug": RenameTenantSlugProps;
	}
}

export type RenameTenantSlugProps = {
	tenantId: string;
	currentSlug: string;
};

export const RenameTenantSlugModal = ({
	tenantId,
	currentSlug,
	onClose,
}: RenameTenantSlugProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useRenameTenantSlug();

	const methods = useForm<RenameTenantSlugFormValues>({
		defaultValues: { slug: currentSlug },
		resolver: zodResolver(renameTenantSlugSchema),
		mode: "onBlur",
	});

	const slug = methods.watch("slug");
	const unchanged = slug === currentSlug;

	const onSubmit = async (values: RenameTenantSlugFormValues) => {
		setSubmitError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId } },
				body: { slug: values.slug.trim() },
			});
			onClose();
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Failed to rename");
		}
	};

	return (
		<BaseModal
			overline="URL settings"
			title="Rename slug"
			size="md"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Rename",
				onClick: methods.handleSubmit(onSubmit),
				loading: isPending,
				disabled: unchanged,
				role: "danger",
			}}
			secondaryAction={{
				label: "Cancel",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<Form methods={methods} onSubmit={onSubmit}>
				<div className="rounded-md bg-warning/10 px-4 py-3 text-sm leading-normal text-warning">
					Renaming the slug changes all public URLs for this church. Any
					existing links using the old slug will stop working.
				</div>
				<FormInput inputName="slug" label="Slug" />
				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
