"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
	Form,
	FormButton,
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
import { CollapsedGiftRow } from "./CollapsedGiftRow";
import { ExpandedGiftRow } from "./ExpandedGiftRow";
import {
	buildEmptyGiftRow,
	buildRecordGiftEntryDefaults,
	type GiftRowValues,
	type RecordGiftEntryValues,
	recordGiftEntrySchema,
} from "./formHelpers";

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
	// Index of the row currently expanded in the inline editor. First row
	// starts open so the modal isn't a blank wall on first open.
	const [editingIndex, setEditingIndex] = useState<number | null>(0);

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
		// All validation runs through explicit `methods.trigger` calls
		// (Save gift, Record gifts). Mode "onSubmit" stops the resolver
		// from blasting errors onto unsaved draft rows on first blur.
		mode: "onSubmit",
	});

	const { fields, append, remove, replace, update } = useFieldArray({
		control: methods.control,
		name: "gifts",
	});

	// The single source of truth for "what gets recorded": a map keyed by
	// each row's `rowId` (a value we generate and store IN the form, so
	// it survives RHF internals like update()/replace() that regenerate
	// useFieldArray's `field.id`). Presence in the map ⇒ the user
	// committed this row via Save. The value is the snapshot of the row
	// at the moment of save — used for the footer total/count AND for
	// the payload sent to the API. Form state for an open editor is
	// treated as a scratchpad and is NEVER read at submission.
	const [saved, setSaved] = useState<Map<string, GiftRowValues>>(
		() => new Map(),
	);

	const markSaved = (rowId: string, values: GiftRowValues) => {
		setSaved((prev) => {
			const next = new Map(prev);
			next.set(rowId, values);
			return next;
		});
	};

	const unmarkSaved = (rowId: string) => {
		setSaved((prev) => {
			if (!prev.has(rowId)) {
				return prev;
			}
			const next = new Map(prev);
			next.delete(rowId);
			return next;
		});
	};

	const savedGiftCount = useMemo(
		() => fields.reduce((n, f) => (saved.has(f.rowId) ? n + 1 : n), 0),
		[fields, saved],
	);
	const total = useMemo(() => {
		let sum = 0;
		for (const f of fields) {
			const snap = saved.get(f.rowId);
			if (snap) {
				sum += Number(snap.amount) || 0;
			}
		}
		return sum;
	}, [fields, saved]);
	const countLabel = `${savedGiftCount} ${savedGiftCount === 1 ? "gift" : "gifts"}`;

	const isEditing = editingIndex !== null;
	// Adding another row while an editor is open would silently strand the
	// in-flight edit. "Save & add another" inside the editor covers the
	// real use case, so we keep this rule strict and predictable.
	const addGiftDisabled = isEditing;

	const onSubmit = async () => {
		setSubmitError(null);

		// Top-level fields (only `date` is currently required).
		const headerOk = await methods.trigger(["memberId", "date"]);
		if (!headerOk) {
			return;
		}

		// Pull the committed snapshots — never the live form state — so
		// any unsaved edits on a re-opened row are correctly excluded.
		const items = fields
			.map((f) => saved.get(f.rowId))
			.filter((s): s is GiftRowValues => Boolean(s));
		if (items.length === 0) {
			return;
		}

		const date = methods.getValues("date");
		const memberId = methods.getValues("memberId");

		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug } },
				body: {
					items: items.map((g) => ({
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

	const handleAddGift = () => {
		append(buildEmptyGiftRow());
		setEditingIndex(fields.length);
	};

	const handleEditRow = (index: number) => {
		// Re-opening a previously-saved row: the snapshot in `saved`
		// already represents the baseline that Discard should restore to,
		// so we deliberately do NOT overwrite it here.
		setEditingIndex(index);
	};

	const handleDiscard = (index: number) => {
		const rowId = fields[index]?.rowId;
		const snapshot = rowId ? saved.get(rowId) : undefined;
		methods.clearErrors(`gifts.${index}`);

		if (!snapshot) {
			// Never saved → drop the row entirely.
			remove(index);
			setEditingIndex(null);
			return;
		}

		// Restore the saved values, throwing away any in-flight edits.
		// `update` regenerates useFieldArray's internal id, but the rowId
		// inside the snapshot is preserved → the saved map still maps.
		update(index, snapshot);
		setEditingIndex(null);
	};

	const handleRemoveRow = (index: number) => {
		const rowId = fields[index]?.rowId;
		if (rowId) {
			unmarkSaved(rowId);
		}
		remove(index);
		setEditingIndex((cur) => {
			if (cur === index) {
				return null;
			}
			if (cur !== null && cur > index) {
				return cur - 1;
			}
			return cur;
		});
	};

	const handleClearAll = () => {
		setSaved(new Map());
		replace([]);
		setEditingIndex(null);
	};

	const handleSaveRow = async (index: number, addAnother: boolean) => {
		// `methods.trigger` runs the strict giftRowSchema for this row and
		// surfaces field-level errors natively in the editor.
		const ok = await methods.trigger(`gifts.${index}`);
		if (!ok) {
			return;
		}

		const values = methods.getValues(`gifts.${index}`) as GiftRowValues;
		markSaved(values.rowId, values);

		if (addAnother) {
			append(buildEmptyGiftRow());
			setEditingIndex(fields.length);
		} else {
			setEditingIndex(null);
		}
	};

	return (
		<BaseModal
			overline="New entry"
			title="Record gifts"
			size="lg"
			onClose={onClose}
			dismissible={!isPending}
			footerHint={
				isEditing
					? `Total ${formatCurrency(total)} · ${countLabel} · save or discard the open gift first`
					: `Total ${formatCurrency(total)} · ${countLabel}`
			}
			primaryAction={{
				label: `Record ${countLabel}`,
				onClick: onSubmit,
				loading: isPending,
				disabled: savedGiftCount === 0 || isEditing,
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

				<div className="flex items-center justify-between px-1">
					<span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
						Gifts in this entry
					</span>
					<div className="flex items-center gap-3">
						<span className="text-xs text-muted-foreground">{countLabel}</span>
						{fields.length > 0 && (
							<Pressable
								onClick={handleClearAll}
								disabled={isPending}
								className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-destructive hover:underline disabled:opacity-40"
							>
								Clear all
							</Pressable>
						)}
					</div>
				</div>

				<div className="flex max-h-[48vh] flex-col gap-2 overflow-y-auto pr-1">
					{fields.map((field, index) =>
						editingIndex === index ? (
							<ExpandedGiftRow
								key={field.rowId}
								tenantSlug={tenantSlug}
								index={index}
								onDiscard={() => handleDiscard(index)}
								onSave={() => handleSaveRow(index, false)}
								onSaveAndAdd={() => handleSaveRow(index, true)}
							/>
						) : (
							<CollapsedGiftRow
								key={field.rowId}
								index={index}
								onExpand={() => handleEditRow(index)}
								onRemove={() => handleRemoveRow(index)}
							/>
						),
					)}

					<FormButton
						icon="plus"
						type="button"
						variant="ghost"
						disabled={addGiftDisabled}
						onClick={handleAddGift}
						className="w-full justify-center gap-2 rounded-2xl border border-dashed border-border bg-card py-3 text-sm font-medium text-muted-foreground hover:bg-muted/60 disabled:opacity-50"
					>
						Add another gift
					</FormButton>
				</div>

				{submitError && (
					<p className="m-0 text-sm text-destructive">{submitError}</p>
				)}
			</Form>
		</BaseModal>
	);
};
