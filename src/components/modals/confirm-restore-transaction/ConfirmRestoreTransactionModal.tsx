"use client";

import { useState } from "react";
import { useRestoreTransaction } from "@/lib/api/transactions";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-restore-transaction": ConfirmRestoreTransactionProps;
	}
}

export type ConfirmRestoreTransactionProps = {
	tenantId: string;
	transactionId: string;
	summary: string;
	onRestored?: () => void;
};

export const ConfirmRestoreTransactionModal = ({
	tenantId,
	transactionId,
	summary,
	onRestored,
	onClose,
}: ConfirmRestoreTransactionProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useRestoreTransaction(tenantId);

	const handleRestore = async () => {
		setError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId, id: transactionId } },
			});
			onRestored?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to restore");
		}
	};

	return (
		<BaseModal
			title="Restore this transaction?"
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Restore transaction",
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
				{summary}
			</p>
			<p className="mt-3 text-sm leading-relaxed text-secondary-foreground">
				Restoring will re-include this transaction in tenant totals and any
				linked pledge's paid amount.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
