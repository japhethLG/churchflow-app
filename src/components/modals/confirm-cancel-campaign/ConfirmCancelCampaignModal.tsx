"use client";

import { useState } from "react";
import { useUpdateCampaign } from "@/lib/api/campaigns";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-cancel-campaign": ConfirmCancelCampaignProps;
	}
}

export type ConfirmCancelCampaignProps = {
	tenantSlug: string;
	campaignId: string;
	campaignTitle: string;
	onCancelled?: () => void;
};

export const ConfirmCancelCampaignModal = ({
	tenantSlug,
	campaignId,
	campaignTitle,
	onCancelled,
	onClose,
}: ConfirmCancelCampaignProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useUpdateCampaign(tenantSlug);

	const handleCancel = async () => {
		setError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug, id: campaignId } },
				body: { status: "CANCELLED" },
			});
			onCancelled?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to cancel");
		}
	};

	return (
		<BaseModal
			title={`Cancel "${campaignTitle}"?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Cancel campaign",
				onClick: handleCancel,
				loading: isPending,
				destructive: true,
			}}
			secondaryAction={{
				label: "Keep open",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
				Sets the campaign status to <strong>Cancelled</strong>. Members will no
				longer see it in the giving flow, and existing pledges remain on the
				books for record-keeping.
			</p>
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
