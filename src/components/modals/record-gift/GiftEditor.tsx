"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import {
	FormAmountInput,
	FormButton,
	FormInput,
	FormOptionGroup,
	FormSelect,
} from "@/components/formElements";
import { Button } from "@/components/primitives/Button";
import { Icon } from "@/components/primitives/Icon";
import { useCampaign, useCampaigns } from "@/lib/api/campaigns";
import { usePledges } from "@/lib/api/pledges";
import { formatCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";
import type { RecordGiftEntryValues } from "./formHelpers";
import { TYPE_OPTIONS } from "./formHelpers";

export type GiftEditorProps = {
	tenantSlug: string;
	mode: "new" | { editingIndex: number };
	onSave: () => void;
	onCancelEdit: () => void;
	onClear: () => void;
	isDirty: boolean;
	dirtyDraftWarning: boolean;
};

const BASE = "draft" as const;

export const GiftEditor = ({
	tenantSlug,
	mode,
	onSave,
	onCancelEdit,
	onClear,
	isDirty,
	dirtyDraftWarning,
}: GiftEditorProps) => {
	const methods = useFormContext<RecordGiftEntryValues>();
	const isEditing = mode !== "new";

	const memberId = useWatch({ name: "memberId" }) as string;
	const amount = useWatch({ name: `${BASE}.amount` }) as string;
	const campaignId = useWatch({ name: `${BASE}.campaignId` }) as string;
	const pledgeId = useWatch({ name: `${BASE}.pledgeId` }) as string;

	const rowIsValid = Boolean(amount) && Number(amount) > 0;

	const { data: campaignsData } = useCampaigns(tenantSlug);
	const { data: campaignDetail } = useCampaign(
		tenantSlug,
		campaignId,
		Boolean(campaignId),
	);
	const campaignItems = campaignDetail?.items ?? [];

	// Options list: active campaigns, plus the currently-selected campaign
	// even if it's no longer ACTIVE (paused/archived/etc.). If the selected
	// campaign isn't in the list at all (e.g., not on the first page, or
	// archived and excluded by the list endpoint), use the loaded detail to
	// synthesise an entry so the Select displays the title rather than the
	// raw UUID.
	const campaigns = useMemo(() => {
		const base = (campaignsData?.items ?? []).filter(
			(c) => c.status === "ACTIVE" || c.id === campaignId,
		);
		if (
			campaignId &&
			campaignDetail &&
			!base.some((c) => c.id === campaignId)
		) {
			return [...base, campaignDetail];
		}
		return base;
	}, [campaignsData, campaignDetail, campaignId]);
	const campaignsEmpty = campaigns.length === 0;

	const { data: pledgesData } = usePledges(
		tenantSlug,
		{
			memberId,
			status: "ACTIVE",
			campaignId: campaignId || undefined,
			limit: 20,
		},
		Boolean(memberId),
	);
	const pledges = pledgesData?.items ?? [];

	const earmarkDisabled =
		!campaignId || campaignItems.length === 0 || Boolean(pledgeId);
	const earmarkHint = pledgeId
		? "Locked by pledge attribution"
		: !campaignId
			? "Select a campaign first"
			: campaignItems.length === 0
				? "This campaign has no earmarks"
				: undefined;

	const pledgeDisabled = !memberId || pledges.length === 0;
	const pledgeHint = !memberId
		? "Select a member to link a pledge"
		: pledges.length === 0
			? "No active pledges for this member"
			: undefined;

	useEffect(() => {
		const sub = methods.watch((value, info) => {
			if (!info.name) {
				return;
			}

			if (info.name === "memberId") {
				methods.setValue(`${BASE}.pledgeId`, "");
				return;
			}

			if (info.name === `${BASE}.campaignId`) {
				// Only clear the linked pledge / earmark if they're now
				// inconsistent with the new campaign. This avoids the
				// cascade where the pledge handler's own setValue on
				// campaignId would otherwise clear the pledge it just set.
				const nextCampaignId = (value.draft?.campaignId ?? "") as string;
				const currentPledgeId = (value.draft?.pledgeId ?? "") as string;
				const linkedPledge = currentPledgeId
					? pledges.find((p) => p.id === currentPledgeId)
					: undefined;

				if (linkedPledge && linkedPledge.campaignId === nextCampaignId) {
					// Pledge is still consistent with the new campaign — keep it.
					// The earmark will be (re)set by the pledge handler.
					return;
				}

				methods.setValue(`${BASE}.campaignItemId`, "");
				methods.setValue(`${BASE}.pledgeId`, "");
				return;
			}

			if (info.name === `${BASE}.pledgeId`) {
				const newPledgeId = (value.draft?.pledgeId ?? "") as string;
				if (!newPledgeId) {
					return;
				}
				const p = pledges.find((x) => x.id === newPledgeId);
				if (!p) {
					return;
				}
				if (p.campaignId !== value.draft?.campaignId) {
					methods.setValue(`${BASE}.campaignId`, p.campaignId);
				}
				const itemId =
					typeof p.campaignItemId === "string" ? p.campaignItemId : "";
				if (itemId !== (value.draft?.campaignItemId ?? "")) {
					methods.setValue(`${BASE}.campaignItemId`, itemId);
				}
			}
		});
		return () => sub.unsubscribe();
	}, [methods, pledges]);

	// Elevation hint: when the body is scrolled off the top, drop a soft
	// shadow under the header so it reads as floating above the content.
	// Replaces a static bottom border, which felt heavy when the body
	// wasn't scrolled.
	const bodyRef = useRef<HTMLDivElement>(null);
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const el = bodyRef.current;
		if (!el) {
			return;
		}
		const onScroll = () => setScrolled(el.scrollTop > 0);
		onScroll();
		el.addEventListener("scroll", onScroll, { passive: true });
		return () => el.removeEventListener("scroll", onScroll);
	}, []);

	const headerLabel = isEditing
		? `Editing gift #${mode.editingIndex + 1}`
		: "New gift";

	return (
		<div className="flex max-h-[52vh] min-h-[280px] flex-col overflow-hidden rounded-2xl border border-border bg-card">
			<div
				className={cn(
					"flex shrink-0 items-center justify-between gap-3 bg-card px-4 py-3 transition-shadow",
					scrolled
						? "shadow-[0_4px_8px_-4px_rgba(15,23,42,0.12)]"
						: "shadow-none",
				)}
			>
				<div className="flex min-w-0 items-center gap-2">
					<span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-primary">
						<Icon name="gift" size={14} />
					</span>
					<span className="truncate font-semibold text-foreground">
						{headerLabel}
					</span>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<FormButton
						type="button"
						variant="primary"
						size="sm"
						disabled={!rowIsValid}
						onClick={onSave}
					>
						{isEditing ? "Update" : "Add"}
					</FormButton>
					<Button
						variant="danger-outline"
						size="sm"
						icon={isEditing ? "close" : "eraser"}
						aria-label="Clear form"
						className="size-8 shrink-0 px-0"
						disabled={!isDirty && !isEditing}
						onClick={isEditing ? onCancelEdit : onClear}
					/>
				</div>
			</div>

			<div
				ref={bodyRef}
				className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 pt-2"
			>
				<FormAmountInput inputName={`${BASE}.amount`} label="Amount" />
				<FormOptionGroup
					inputName={`${BASE}.type`}
					label="Type"
					variant="chip"
					options={TYPE_OPTIONS.map((o) => ({
						value: o.value,
						label: o.label,
					}))}
				/>

				<FormSelect
					inputName={`${BASE}.pledgeId`}
					label="Against pledge (optional)"
					disabled={pledgeDisabled}
					hint={pledgeHint}
					options={[
						{ value: "", label: "Don't link a pledge" },
						...pledges.map((p) => ({
							value: p.id,
							label: `${formatCurrency(p.pledgedAmount)} pledge${
								p.campaignItemId ? " · earmarked" : ""
							}`,
						})),
					]}
				/>

				<FormSelect
					inputName={`${BASE}.campaignId`}
					label="Campaign (optional)"
					disabled={campaignsEmpty}
					hint={campaignsEmpty ? "No active campaigns" : undefined}
					options={[
						{ value: "", label: "None" },
						...campaigns.map((c) => ({ value: c.id, label: c.title })),
					]}
				/>

				<FormSelect
					inputName={`${BASE}.campaignItemId`}
					label="Earmark (optional)"
					disabled={earmarkDisabled}
					hint={earmarkHint}
					options={[
						{ value: "", label: "Whole campaign" },
						...campaignItems.map((it) => ({ value: it.id, label: it.title })),
					]}
				/>

				<FormInput
					inputName={`${BASE}.referenceNumber`}
					label="Reference # (optional)"
					placeholder="CHK-1402"
				/>
				<FormInput
					inputName={`${BASE}.note`}
					label="Note (optional)"
					placeholder="e.g. Sunday Worship"
				/>

				{dirtyDraftWarning && (
					<p className="m-0 text-xs text-destructive">
						Save or discard your draft before opening another gift.
					</p>
				)}
			</div>
		</div>
	);
};
