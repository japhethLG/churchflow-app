"use client";

import { useState } from "react";
import { useDeleteTransaction } from "@/lib/api/transactions";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-delete-transaction": ConfirmDeleteTransactionProps;
	}
}

export type ConfirmDeleteTransactionProps = {
	tenantSlug: string;
	transactionId: string;
	amountLabel: string;
	onDeleted?: () => void;
};

export const ConfirmDeleteTransactionModal = ({
	tenantSlug,
	transactionId,
	amountLabel,
	onDeleted,
	onClose,
}: ConfirmDeleteTransactionProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useDeleteTransaction(tenantSlug);

	const handleDelete = async () => {
		setError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug, id: transactionId } },
			});
			onDeleted?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete");
		}
	};

	return (
		<BaseModal
			title={`Delete ${amountLabel} gift?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Delete gift",
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
				Removes this transaction from the ledger. Campaign and pledge totals
				will recompute. This is for correcting mis-entries — keep records
				honest.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
