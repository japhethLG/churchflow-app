"use client";

import { useState } from "react";
import { useToggleSuperAdmin } from "@/lib/api/admin";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-toggle-super-admin": ConfirmToggleSuperAdminProps;
	}
}

export type ConfirmToggleSuperAdminProps = {
	userId: string;
	userName: string;
	currentIsSuperAdmin: boolean;
};

export const ConfirmToggleSuperAdminModal = ({
	userId,
	userName,
	currentIsSuperAdmin,
	onClose,
}: ConfirmToggleSuperAdminProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useToggleSuperAdmin();
	const promoting = !currentIsSuperAdmin;

	const handleToggle = async () => {
		setError(null);
		try {
			await mutateAsync({
				params: { path: { id: userId } },
				body: { isSuperAdmin: promoting },
			});
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Operation failed");
		}
	};

	return (
		<BaseModal
			title={promoting ? `Promote ${userName}?` : `Demote ${userName}?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: promoting ? "Promote to super admin" : "Demote from super admin",
				onClick: handleToggle,
				loading: isPending,
				destructive: !promoting,
			}}
			secondaryAction={{
				label: "Cancel",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
				{promoting
					? `${userName} will gain full platform access including all churches and admin controls.`
					: `${userName} will lose platform-wide admin access. Their existing church memberships are unchanged.`}
			</p>
			<p className="mt-3 text-sm leading-normal text-muted-foreground">
				The user must sign out and back in for the change to take effect.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
