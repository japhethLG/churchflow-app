"use client";

import { useState } from "react";
import { useRestoreMember } from "@/lib/api/members";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-restore-member": ConfirmRestoreMemberProps;
	}
}

export type ConfirmRestoreMemberProps = {
	tenantId: string;
	memberId: string;
	memberName: string;
	onRestored?: () => void;
};

export const ConfirmRestoreMemberModal = ({
	tenantId,
	memberId,
	memberName,
	onRestored,
	onClose,
}: ConfirmRestoreMemberProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useRestoreMember(tenantId);

	const handleRestore = async () => {
		setError(null);
		try {
			await mutateAsync({ params: { path: { tenantId, id: memberId } } });
			onRestored?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to restore");
		}
	};

	return (
		<BaseModal
			title={`Restore ${memberName}?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Restore member",
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
				This will restore the member. Their historical pledges and giving
				records remain attached.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
