"use client";

import { useState } from "react";
import { useRestoreCampaignItem } from "@/lib/api/campaigns";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-restore-campaign-item": ConfirmRestoreCampaignItemProps;
	}
}

export type ConfirmRestoreCampaignItemProps = {
	tenantId: string;
	campaignId: string;
	itemId: string;
	itemTitle: string;
	onRestored?: () => void;
};

export const ConfirmRestoreCampaignItemModal = ({
	tenantId,
	campaignId,
	itemId,
	itemTitle,
	onRestored,
	onClose,
}: ConfirmRestoreCampaignItemProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useRestoreCampaignItem(tenantId);

	const handleRestore = async () => {
		setError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId, id: campaignId, itemId } },
			});
			onRestored?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to restore");
		}
	};

	return (
		<BaseModal
			title={`Restore "${itemTitle}"?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Restore item",
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
				The item will reappear in the campaign breakdown and its target amount
				will count toward the campaign goal again.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
