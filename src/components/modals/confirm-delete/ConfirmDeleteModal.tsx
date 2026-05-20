"use client";

import { useState } from "react";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-delete": ConfirmDeleteProps;
	}
}

export type ConfirmDeleteProps = {
	title: string;
	message?: string;
	confirmLabel?: string;
	onConfirm: () => Promise<void> | void;
};

export const ConfirmDeleteModal = ({
	title,
	message,
	confirmLabel = "Delete",
	onConfirm,
	onClose,
}: ConfirmDeleteProps & ModalBaseProps) => {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleConfirm = async () => {
		setBusy(true);
		setError(null);
		try {
			await onConfirm();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed");
			setBusy(false);
		}
	};

	return (
		<BaseModal
			title={title}
			size="sm"
			onClose={onClose}
			dismissible={!busy}
			primaryAction={{
				label: confirmLabel,
				onClick: handleConfirm,
				loading: busy,
				role: "danger",
			}}
			secondaryAction={{ label: "Cancel", onClick: onClose, disabled: busy }}
		>
			{message && (
				<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
					{message}
				</p>
			)}
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
