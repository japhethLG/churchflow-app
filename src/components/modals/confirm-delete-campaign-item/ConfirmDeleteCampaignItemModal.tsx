"use client";

import { useState } from "react";
import { useDeleteCampaignItem } from "@/lib/api/campaigns";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-delete-campaign-item": ConfirmDeleteCampaignItemProps;
	}
}

export type ConfirmDeleteCampaignItemProps = {
	tenantSlug: string;
	campaignId: string;
	itemId: string;
	itemTitle: string;
};

export const ConfirmDeleteCampaignItemModal = ({
	tenantSlug,
	campaignId,
	itemId,
	itemTitle,
	onClose,
}: ConfirmDeleteCampaignItemProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useDeleteCampaignItem(tenantSlug);

	const handleDelete = async () => {
		setError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug, id: campaignId, itemId } },
			});
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to remove item");
		}
	};

	return (
		<BaseModal
			title={`Remove "${itemTitle}"?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Remove item",
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
				Removes this line item from the campaign. The campaign goal drops by
				this item&apos;s target. Pledges that targeted this item specifically
				will become campaign-wide pledges.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
