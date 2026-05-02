"use client";

import { useState } from "react";
import { useRestoreTenant } from "@/lib/api/tenants";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-restore-tenant": ConfirmRestoreTenantProps;
	}
}

export type ConfirmRestoreTenantProps = {
	tenantId: string;
	tenantName: string;
	onRestored?: () => void;
};

export const ConfirmRestoreTenantModal = ({
	tenantId,
	tenantName,
	onRestored,
	onClose,
}: ConfirmRestoreTenantProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useRestoreTenant();

	const handleRestore = async () => {
		setError(null);
		try {
			await mutateAsync({ params: { path: { tenantId } } });
			onRestored?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to restore");
		}
	};

	return (
		<BaseModal
			title={`Restore "${tenantName}"?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Restore church",
				onClick: handleRestore,
				loading: isPending,
			}}
			secondaryAction={{
				label: "Cancel",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
				This will restore the church and all its data. Members and admins will
				regain access.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
