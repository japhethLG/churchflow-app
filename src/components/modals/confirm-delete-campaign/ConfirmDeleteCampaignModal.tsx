"use client";

import { useState } from "react";
import { useDeleteCampaign } from "@/lib/api/campaigns";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-delete-campaign": ConfirmDeleteCampaignProps;
	}
}

export type ConfirmDeleteCampaignProps = {
	tenantSlug: string;
	campaignId: string;
	campaignTitle: string;
	onDeleted?: () => void;
};

export const ConfirmDeleteCampaignModal = ({
	tenantSlug,
	campaignId,
	campaignTitle,
	onDeleted,
	onClose,
}: ConfirmDeleteCampaignProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useDeleteCampaign(tenantSlug);

	const handleDelete = async () => {
		setError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug, id: campaignId } },
			});
			onDeleted?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete");
		}
	};

	return (
		<BaseModal
			title={`Delete "${campaignTitle}"?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Delete campaign",
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
				Soft-deletes the campaign and all its items. Existing pledges and gifts
				attributed to it remain in giving history, but no new pledges can be
				made. To halt without deleting, cancel it instead.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
