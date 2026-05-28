"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { FormDatePicker, FormMemberPicker } from "@/components/formElements";
import {
	buildEmptyDraft,
	buildRecordGiftEntryDefaults,
	type GiftRowValues,
	type RecordGiftEntryValues,
	recordGiftEntrySchema,
} from "@/components/modals/record-gift/formHelpers";
import { SavedGiftItem } from "@/components/modals/record-gift/SavedGiftItem";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Icon } from "@/components/primitives/Icon";
import { BaseSheet } from "@/components/sheets/BaseSheet";
import { useMembers } from "@/lib/api/members";
import { useBulkCreateTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import type { SheetBaseProps } from "@/lib/sheets/registry";
import { useSheetDrill } from "@/lib/sheets/useSheetDrill";
import { MobileGiftFields } from "./MobileGiftFields";

export type RecordGiftSheetProps = {
	tenantSlug: string;
	defaultMemberId?: string;
	defaultCampaignId?: string;
	defaultPledgeId?: string;
};

declare module "@/lib/sheets/registry" {
	interface SheetPropsMap {
		"record-gift": RecordGiftSheetProps;
	}
}

type View = "hub" | "add-gift";

/**
 * Mobile bulk-entry record-gift sheet. Adapted from the desktop modal:
 * Member + Date applied once to a list of staged gifts. The only drill-
 * down is the add-gift form (hub → spoke); pickers are inline (popover-
 * style), same as desktop.
 */
export const RecordGiftSheet = ({
	open,
	onOpenChange,
	onOpenChangeComplete,
	tenantSlug,
	defaultMemberId,
	defaultCampaignId,
	defaultPledgeId,
}: SheetBaseProps & RecordGiftSheetProps) => {
	const drill = useSheetDrill<View>("hub", open);
	const [savedGifts, setSavedGifts] = useState<GiftRowValues[]>([]);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const methods = useForm<RecordGiftEntryValues>({
		defaultValues: buildRecordGiftEntryDefaults({
			defaultMemberId,
			defaultCampaignId,
			defaultPledgeId,
		}),
		resolver: zodResolver(recordGiftEntrySchema),
		mode: "onSubmit",
	});

	const { data: membersData } = useMembers(tenantSlug, { limit: 200 });
	const members = membersData?.items ?? [];
	const { mutateAsync, isPending } = useBulkCreateTransactions(tenantSlug);

	// Subscribed at the parent so the footer button label tracks the draft
	// amount live. `control` access works outside FormProvider too.
	const draftAmount = useWatch({
		control: methods.control,
		name: "draft.amount",
	}) as string;
	const draftAmountNum = Number(draftAmount) || 0;

	const total = useMemo(
		() => savedGifts.reduce((s, g) => s + (Number(g.amount) || 0), 0),
		[savedGifts],
	);

	const resetDraft = (carryType?: GiftRowValues["type"]) => {
		methods.clearErrors("draft");
		methods.setValue(
			"draft",
			buildEmptyDraft({
				type: carryType ?? methods.getValues("draft.type"),
				defaultCampaignId,
				defaultPledgeId,
			}),
			{ shouldDirty: false, shouldTouch: false, shouldValidate: false },
		);
	};

	const handleAddGift = () => {
		resetDraft();
		setEditingIndex(null);
		drill.drillTo("add-gift");
	};

	const handleEditGift = (index: number) => {
		const target = savedGifts[index];
		if (!target) {
			return;
		}
		methods.setValue("draft", target, {
			shouldDirty: false,
			shouldTouch: false,
			shouldValidate: false,
		});
		setEditingIndex(index);
		drill.drillTo("add-gift");
	};

	const handleSaveDraft = async () => {
		const ok = await methods.trigger("draft");
		if (!ok) {
			return;
		}
		const values = methods.getValues("draft");
		if (editingIndex !== null) {
			setSavedGifts((prev) => {
				const next = prev.slice();
				next[editingIndex] = values;
				return next;
			});
		} else {
			setSavedGifts((prev) => [...prev, values]);
		}
		setEditingIndex(null);
		resetDraft(values.type);
		drill.drillBack();
	};

	const handleRemoveGift = (index: number) => {
		setSavedGifts((prev) => prev.filter((_, i) => i !== index));
	};

	const handleCancelAddGift = () => {
		setEditingIndex(null);
		resetDraft();
		drill.drillBack();
	};

	const onSubmit = async () => {
		if (savedGifts.length === 0 || isPending) {
			return;
		}
		setSubmitError(null);
		const headerOk = await methods.trigger(["memberId", "date"]);
		if (!headerOk) {
			return;
		}
		const date = methods.getValues("date");
		const memberId = methods.getValues("memberId");
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug } },
				body: {
					items: savedGifts.map((g) => ({
						type: g.type,
						amount: Number(g.amount),
						date: dayjs(date).toISOString(),
						memberId: memberId || undefined,
						campaignId: g.campaignId || undefined,
						campaignItemId: g.campaignItemId || undefined,
						pledgeId: g.pledgeId || undefined,
						note: g.note.trim() || undefined,
						referenceNumber: g.referenceNumber.trim() || undefined,
					})),
				},
			});
			onOpenChange(false);
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Could not record gifts",
			);
		}
	};

	const inAddGift = drill.view === "add-gift";
	const recordDisabled = savedGifts.length === 0 || isPending;

	return (
		<FormProvider {...methods}>
			<BaseSheet
				open={open}
				onOpenChange={onOpenChange}
				onOpenChangeComplete={onOpenChangeComplete}
				initialSnap={1}
				title={inAddGift ? "Add gift" : "Record gifts"}
				description={
					inAddGift
						? undefined
						: "Add one or many gifts for this member and date."
				}
				onBack={inAddGift ? () => drill.drillBack() : undefined}
				contentClassName="overflow-x-hidden"
				footer={
					inAddGift ? (
						<div className="flex items-center gap-2">
							<Button
								role="secondary"
								recipe="outline"
								onClick={handleCancelAddGift}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button
								role="primary"
								recipe="gradient"
								onClick={handleSaveDraft}
								disabled={!draftAmount || draftAmountNum <= 0}
								className="flex-[1.5]"
							>
								{editingIndex !== null ? "Update" : "Add"} gift
								{draftAmountNum > 0
									? ` · ${formatCurrency(draftAmountNum)}`
									: ""}
							</Button>
						</div>
					) : (
						<div className="flex items-center gap-3">
							<div className="min-w-0 flex-1">
								<div className="text-base font-bold tracking-tight tabular-nums">
									{formatCurrency(total)}
								</div>
								<div className="text-[11px] text-muted-foreground">
									{savedGifts.length === 0
										? "No gifts yet"
										: `${savedGifts.length} gift${savedGifts.length === 1 ? "" : "s"} staged`}
								</div>
							</div>
							<Button
								role="primary"
								recipe="gradient"
								onClick={onSubmit}
								disabled={recordDisabled}
								loading={isPending}
							>
								Record{savedGifts.length > 0 ? ` ${savedGifts.length}` : ""}{" "}
								gift{savedGifts.length === 1 ? "" : "s"}
							</Button>
						</div>
					)
				}
			>
				<div key={drill.view} className={drill.transitionClass}>
					{inAddGift ? (
						<MobileGiftFields tenantSlug={tenantSlug} />
					) : (
						<HubBody
							savedGifts={savedGifts}
							members={members}
							submitError={submitError}
							onAddGift={handleAddGift}
							onEditGift={handleEditGift}
							onRemoveGift={handleRemoveGift}
						/>
					)}
				</div>
			</BaseSheet>
		</FormProvider>
	);
};

const HubBody = ({
	savedGifts,
	members,
	submitError,
	onAddGift,
	onEditGift,
	onRemoveGift,
}: {
	savedGifts: GiftRowValues[];
	members: Parameters<typeof FormMemberPicker>[0]["members"];
	submitError: string | null;
	onAddGift: () => void;
	onEditGift: (i: number) => void;
	onRemoveGift: (i: number) => void;
}) => {
	return (
		<div className="flex flex-col gap-5 pt-2">
			{/* Inline pickers — popover-driven, same UX as desktop.
			    `overflow-visible` overrides Card's default overflow-hidden so the
			    MemberPicker's absolute dropdown isn't clipped at the card edge. */}
			<Card padding={0} className="overflow-visible gap-0">
				<div className="px-3.5 py-3">
					<div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Member · applies to all gifts
					</div>
					<FormMemberPicker
						inputName="memberId"
						members={members}
						variant="dropdown"
						placeholder="Search or leave blank for anonymous"
					/>
				</div>
				<div className="px-3.5 py-3">
					<div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						Date received
					</div>
					<FormDatePicker inputName="date" />
				</div>
			</Card>

			<div className="">
				<div className="mb-2 flex items-center justify-between px-1 gap-2">
					<div className="text-xs uppercase tracking-widest text-muted-foreground">
						Gifts in this entry
					</div>
					<div className="text-xs font-bold tabular-nums text-muted-foreground">
						{savedGifts.length} GIFT{savedGifts.length === 1 ? "" : "S"}
					</div>
				</div>

				{savedGifts.length === 0 ? (
					<Card padding={0}>
						<div className="grid place-items-center px-4 py-8 text-center">
							<div className="grid size-13 place-items-center rounded-2xl bg-primary/10 text-primary">
								<Icon name="gift" size={22} />
							</div>
							<div className="mt-2.5 text-sm font-bold">No gifts yet</div>
							<div className="mt-1 max-w-[240px] text-[11px] text-muted-foreground">
								Add one or more gifts for this person and date. They'll all be
								recorded together.
							</div>
						</div>
					</Card>
				) : (
					<div className="flex flex-col gap-2">
						{savedGifts.map((g, i) => (
							<SavedGiftItem
								key={g.rowId}
								index={i}
								value={g}
								editing={false}
								onClick={() => onEditGift(i)}
								onRemove={() => onRemoveGift(i)}
							/>
						))}
					</div>
				)}

				<div className="flex justify-center">
					<Button
						role="primary"
						recipe={savedGifts.length === 0 ? "gradient" : "ghost"}
						size="lg"
						icon="plus"
						fullWidth
						onClick={onAddGift}
						className="mt-3 max-w-64"
					>
						{savedGifts.length === 0
							? "Add the first gift"
							: "Add another gift"}
					</Button>
				</div>
			</div>

			{submitError && (
				<p className="m-0 text-sm text-destructive">{submitError}</p>
			)}
		</div>
	);
};
