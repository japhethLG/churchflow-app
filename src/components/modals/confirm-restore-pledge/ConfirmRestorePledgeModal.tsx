"use client";

import { useState } from "react";
import { useRestorePledge } from "@/lib/api/pledges";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-restore-pledge": ConfirmRestorePledgeProps;
	}
}

export type ConfirmRestorePledgeProps = {
	tenantId: string;
	pledgeId: string;
	memberName: string;
	onRestored?: () => void;
};

export const ConfirmRestorePledgeModal = ({
	tenantId,
	pledgeId,
	memberName,
	onRestored,
	onClose,
}: ConfirmRestorePledgeProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useRestorePledge(tenantId);

	const handleRestore = async () => {
		setError(null);
		try {
			await mutateAsync({ params: { path: { tenantId, id: pledgeId } } });
			onRestored?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to restore");
		}
	};

	return (
		<BaseModal
			title={`Restore ${memberName}'s pledge?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Restore pledge",
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
				This will restore the pledge. Linked transactions remain attached and
				the paid / remaining amounts will be recomputed.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
