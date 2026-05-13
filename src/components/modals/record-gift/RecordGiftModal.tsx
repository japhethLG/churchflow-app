"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
	Form,
	FormDatePicker,
	FormMemberPicker,
} from "@/components/formElements";
import { Pressable } from "@/components/primitives/Pressable";
import { useMembers } from "@/lib/api/members";
import { useBulkCreateTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCurrency } from "@/lib/format-currency";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { BaseModal } from "../BaseModal";
import {
	buildEmptyDraft,
	buildRecordGiftEntryDefaults,
	type GiftRowValues,
	isDraftDirty,
	type RecordGiftEntryValues,
	recordGiftEntrySchema,
} from "./formHelpers";
import { GiftEditor } from "./GiftEditor";
import { SavedGiftItem } from "./SavedGiftItem";

const isSameRow = (a: GiftRowValues, b: GiftRowValues | undefined): boolean => {
	if (!b) {
		return false;
	}
	return (
		a.rowId === b.rowId &&
		a.type === b.type &&
		a.amount === b.amount &&
		a.campaignId === b.campaignId &&
		a.campaignItemId === b.campaignItemId &&
		a.pledgeId === b.pledgeId &&
		a.referenceNumber === b.referenceNumber &&
		a.note === b.note
	);
};

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"record-gift": RecordGiftProps;
	}
}

export type RecordGiftProps = {
	tenantSlug: string;
	defaultMemberId?: string;
	defaultCampaignId?: string;
	defaultPledgeId?: string;
};

export const RecordGiftModal = ({
	tenantSlug,
	defaultMemberId,
	defaultCampaignId,
	defaultPledgeId,
	onClose,
}: RecordGiftProps & ModalBaseProps) => {
	const [submitError, setSubmitError] = useState<string | null>(null);
	// Committed gifts live in component state, not in the form. The form only
	// holds the live draft — so reads/resets of the draft never touch the
	// saved list, and saved snapshots never get tangled with in-flight edits.
	const [savedGifts, setSavedGifts] = useState<GiftRowValues[]>([]);
	// null → "new gift" mode (Save appends). number → "edit gift #N" mode
	// (Save replaces savedGifts[N]).
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [dirtyWarning, setDirtyWarning] = useState(false);

	const { data: membersData } = useMembers(tenantSlug, { limit: 200 });
	const members = membersData?.items ?? [];

	const { mutateAsync, isPending } = useBulkCreateTransactions(tenantSlug);

	const methods = useForm<RecordGiftEntryValues>({
		defaultValues: buildRecordGiftEntryDefaults({
			defaultMemberId,
			defaultCampaignId,
			defaultPledgeId,
		}),
		resolver: zodResolver(recordGiftEntrySchema),
		// Explicit `methods.trigger` calls drive validation; "onSubmit" prevents
		// the resolver from showing errors on an empty draft on first render.
		mode: "onSubmit",
	});

	// Subscribed so footer warning + buttons react to draft edits.
	const draft = useWatch({
		control: methods.control,
		name: "draft",
	}) as GiftRowValues | undefined;
	const draftDirty = draft ? isDraftDirty(draft) : false;
	const isEditing = editingIndex !== null;

	const total = useMemo(
		() => savedGifts.reduce((sum, g) => sum + (Number(g.amount) || 0), 0),
		[savedGifts],
	);
	const countLabel = `${savedGifts.length} ${
		savedGifts.length === 1 ? "gift" : "gifts"
	}`;

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

	const handleSaveDraft = async () => {
		const ok = await methods.trigger("draft");
		if (!ok) {
			return;
		}
		const values = methods.getValues("draft");
		setDirtyWarning(false);

		if (editingIndex !== null) {
			setSavedGifts((prev) => {
				const next = prev.slice();
				next[editingIndex] = values;
				return next;
			});
			setEditingIndex(null);
		} else {
			setSavedGifts((prev) => [...prev, values]);
		}
		resetDraft(values.type);
	};

	const handleClickSavedRow = (index: number) => {
		if (editingIndex === index) {
			return;
		}
		// Force the user to deal with unsaved work before switching contexts.
		// "Unsaved work" = the new-gift draft has any data OR the in-flight
		// edit differs from the row it claims to be editing.
		const hasUnsavedWork =
			editingIndex === null
				? draftDirty
				: draft
					? !isSameRow(draft, savedGifts[editingIndex])
					: false;
		if (hasUnsavedWork) {
			setDirtyWarning(true);
			return;
		}
		setDirtyWarning(false);
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
	};

	const handleCancelEdit = () => {
		setDirtyWarning(false);
		setEditingIndex(null);
		resetDraft();
	};

	const handleRemoveRow = (index: number) => {
		setSavedGifts((prev) => prev.filter((_, i) => i !== index));
		setEditingIndex((cur) => {
			if (cur === null) {
				return cur;
			}
			if (cur === index) {
				resetDraft();
				return null;
			}
			return cur > index ? cur - 1 : cur;
		});
	};

	const handleClearAll = () => {
		setSavedGifts([]);
		setEditingIndex(null);
		setDirtyWarning(false);
		resetDraft();
	};

	const recordDisabled =
		savedGifts.length === 0 || isEditing || draftDirty || isPending;

	const onSubmit = async () => {
		if (recordDisabled) {
			// Surface the reason inline instead of silently no-op'ing.
			if (draftDirty || isEditing) {
				setDirtyWarning(true);
			}
			return;
		}
		setSubmitError(null);

		const headerOk = await methods.trigger(["memberId", "date"]);
		if (!headerOk) {
			return;
		}
		if (savedGifts.length === 0) {
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
			onClose();
		} catch (err) {
			setSubmitError(
				err instanceof Error ? err.message : "Could not record gifts",
			);
		}
	};

	const footerHint = (() => {
		if (isEditing) {
			return `Total: ${formatCurrency(total)} · ${countLabel} · finish editing first`;
		}
		if (draftDirty && savedGifts.length > 0) {
			return `Total: ${formatCurrency(total)} · ${countLabel} · save or discard your draft first`;
		}
		return `Total: ${formatCurrency(total)} · ${countLabel}`;
	})();

	return (
		<BaseModal
			overline="New entry"
			title="Record gifts"
			size="xl"
			onClose={onClose}
			dismissible={!isPending}
			footerHint={footerHint}
			primaryAction={{
				label: `Record ${countLabel}`,
				onClick: onSubmit,
				loading: isPending,
				disabled: recordDisabled,
			}}
			secondaryAction={{
				label: "Cancel",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<Form methods={methods} onSubmit={() => onSubmit()} className="gap-4">
				{/* Shared context: member + date apply to every gift in this entry */}
				<div className="rounded-2xl border border-border bg-muted/40 p-4">
					<div className="grid grid-cols-[2fr_1fr] gap-3">
						<FormMemberPicker
							inputName="memberId"
							label="Member · applies to all gifts"
							members={members}
							variant="dropdown"
							placeholder="Search or leave blank for anonymous"
						/>
						<FormDatePicker inputName="date" label="Date" />
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr]">
					{/* LIST — left column */}
					<div className="flex min-w-0 flex-col gap-2">
						<div className="flex items-center justify-between px-1">
							<span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								Gifts in this entry
							</span>
							<div className="flex items-center gap-3">
								<span className="text-xs text-muted-foreground">
									{countLabel}
								</span>
								{savedGifts.length > 0 && (
									<Pressable
										onClick={handleClearAll}
										disabled={isPending}
										className="text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-40"
									>
										Clear all
									</Pressable>
								)}
							</div>
						</div>

						<div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1">
							{savedGifts.length === 0 ? (
								<div className="grid place-items-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
									<p className="m-0 text-sm font-medium text-foreground">
										No gifts yet
									</p>
									<p className="m-0 mt-1 text-xs text-muted-foreground">
										Added gifts will appear here. Fill the form to add one.
									</p>
								</div>
							) : (
								savedGifts.map((g, index) => (
									<SavedGiftItem
										key={g.rowId}
										index={index}
										value={g}
										editing={editingIndex === index}
										onClick={() => handleClickSavedRow(index)}
										onRemove={() => handleRemoveRow(index)}
									/>
								))
							)}
						</div>
					</div>

					{/* FORM — right column */}
					<div className="flex min-w-0 flex-col">
						<GiftEditor
							tenantSlug={tenantSlug}
							mode={editingIndex === null ? "new" : { editingIndex }}
							onSave={handleSaveDraft}
							onCancelEdit={handleCancelEdit}
							onClear={() => resetDraft()}
							isDirty={draftDirty}
							dirtyDraftWarning={dirtyWarning}
						/>
					</div>
				</div>

				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
