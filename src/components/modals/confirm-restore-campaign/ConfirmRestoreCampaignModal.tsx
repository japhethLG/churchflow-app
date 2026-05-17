"use client";

import { useState } from "react";
import {
	useCampaignRestorePreview,
	useRestoreCampaign,
} from "@/lib/api/campaigns";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"confirm-restore-campaign": ConfirmRestoreCampaignProps;
	}
}

export type ConfirmRestoreCampaignProps = {
	tenantId: string;
	campaignId: string;
	campaignTitle: string;
	onRestored?: () => void;
};

// Plural-aware human label for a (modelName, count) pair. The backend
// keys preview counts by Prisma model name (e.g. "CampaignItem"); the FE
// renders user-facing copy.
function describeCascade(model: string, count: number): string {
	if (model === "CampaignItem") {
		return `${count} ${count === 1 ? "item" : "items"}`;
	}
	// Defensive fallback — unknown child types render as "N <ModelName>".
	return `${count} ${model}`;
}

export const ConfirmRestoreCampaignModal = ({
	tenantId,
	campaignId,
	campaignTitle,
	onRestored,
	onClose,
}: ConfirmRestoreCampaignProps & ModalBaseProps) => {
	const [error, setError] = useState<string | null>(null);
	const { mutateAsync, isPending } = useRestoreCampaign(tenantId);
	const { data: preview, isLoading: previewLoading } =
		useCampaignRestorePreview(tenantId, campaignId);

	const cascadeEntries = Object.entries(preview?.cascadeCount ?? {}).filter(
		([, count]) => count > 0,
	);

	const handleRestore = async () => {
		setError(null);
		try {
			await mutateAsync({ params: { path: { tenantId, id: campaignId } } });
			onRestored?.();
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to restore");
		}
	};

	return (
		<BaseModal
			title={`Restore "${campaignTitle}"?`}
			size="sm"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Restore campaign",
				onClick: handleRestore,
				loading: isPending,
				disabled: previewLoading,
			}}
			secondaryAction={{
				label: "Cancel",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<p className="m-0 text-sm leading-relaxed text-secondary-foreground">
				The campaign will reappear in the active list with its history intact.
			</p>
			{cascadeEntries.length > 0 && (
				<p className="mt-3 text-sm leading-relaxed text-secondary-foreground">
					Restoring will also bring back{" "}
					{cascadeEntries
						.map(([model, count]) => describeCascade(model, count))
						.join(" and ")}{" "}
					that {cascadeEntries.length === 1 ? "was" : "were"} removed with the
					campaign.
				</p>
			)}
			{error && <p className="mt-3 text-sm text-destructive">{error}</p>}
		</BaseModal>
	);
};
