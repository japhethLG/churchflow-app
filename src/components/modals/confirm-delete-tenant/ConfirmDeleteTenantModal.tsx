"use client";

import { useState } from "react";
import { useDeleteTenant } from "@/lib/api/tenants";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-delete-tenant": ConfirmDeleteTenantProps;
	}
}

export type ConfirmDeleteTenantProps = {
	tenantId: string;
	tenantName: string;
	onDeleted?: () => void;
};

export const ConfirmDeleteTenantModal = ({
	tenantId,
	tenantName,
	onDeleted,
	onClose,
}: ConfirmDeleteTenantProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useDeleteTenant();

	const handleDelete = async () => {
		setError(null);
		try {
			await mutateAsync({ params: { path: { tenantId } } });
			onDeleted?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete");
		}
	};

	return (
		<BaseModal
			title={`Delete "${tenantName}"?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Delete church",
				onClick: handleDelete,
				loading: isPending,
				role: "danger",
			}}
			secondaryAction={{
				label: "Cancel",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
				This will soft-delete the church. All data is preserved and the church
				can be restored later.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
