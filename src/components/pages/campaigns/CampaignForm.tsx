"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import {
	Form,
	FormButton,
	FormDatePicker,
	FormInput,
	FormOptionGroup,
} from "@/components/formElements";
import { Button, Card, Icon, SectionTitle } from "@/components/primitives";
import {
	type CampaignFormValues,
	campaignSchema,
	newItemDraft,
	STATUS_OPTIONS,
} from "./formHelpers";

export const CampaignForm = ({
	onSubmit,
	onCancel,
	initialValues,
	submitLabel,
	showStatus = true,
	itemsEditable = true,
}: {
	onSubmit: (values: CampaignFormValues) => Promise<void>;
	onCancel: () => void;
	initialValues?: Partial<CampaignFormValues>;
	submitLabel: string;
	showStatus?: boolean;
	itemsEditable?: boolean;
}) => {
	const methods = useForm<CampaignFormValues>({
		resolver: zodResolver(campaignSchema) as any,
		defaultValues: {
			title: "",
			description: "",
			deadline: "",
			status: "DRAFT",
			items: [newItemDraft()],
			...initialValues,
		},
	});

	const {
		control,
		watch,
		reset,
		setError,
		formState: { isSubmitting, errors },
	} = methods;

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
		keyName: "fieldId",
	});

	// Update form when initialValues change (e.g. after data load)
	useEffect(() => {
		if (initialValues) {
			reset({
				title: "",
				description: "",
				deadline: "",
				status: "DRAFT",
				items: [newItemDraft()],
				...initialValues,
			});
		}
	}, [initialValues, reset]);

	const handleFormSubmit = async (values: CampaignFormValues) => {
		try {
			await onSubmit(values);
		} catch (err) {
			setError("root", {
				message: err instanceof Error ? err.message : "An error occurred",
			});
		}
	};

	return (
		<Form methods={methods} onSubmit={handleFormSubmit} className="w-2xl">
			<Card padding={24}>
				<SectionTitle title="Campaign details" />
				<div className="flex flex-col gap-4">
					<FormInput
						inputName="title"
						label="Title"
						placeholder="Building Fund"
					/>
					<FormInput
						inputName="description"
						label="Description (optional)"
						placeholder="What this campaign is raising for…"
					/>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<FormDatePicker
							inputName="deadline"
							label="Deadline (optional)"
							placeholder="Pick a date"
							helper="Leave blank for open-ended"
						/>
					</div>

					{showStatus && (
						<FormOptionGroup
							inputName="status"
							label="Status"
							options={STATUS_OPTIONS.map((o) => ({
								value: o.value,
								label: o.label,
								hint: o.hint,
							}))}
						/>
					)}
				</div>
			</Card>

			<Card padding={24}>
				<div className="mb-4 flex items-center justify-between">
					<SectionTitle title="Line items" />
					{itemsEditable && (
						<Button
							variant="secondary"
							size="sm"
							icon="plus"
							onClick={() => append(newItemDraft())}
						>
							Add item
						</Button>
					)}
				</div>
				<p className="mb-4 text-xs text-muted-foreground">
					The campaign goal is the sum of these items&apos; targets. Members can
					pledge to a single item or to the campaign as a whole.
				</p>

				{fields.length === 0 ? (
					<div className="rounded-xl border-[1.5px] border-dashed border-input py-6 text-center text-sm text-muted-foreground">
						Add at least one item to start tracking pledges.
					</div>
				) : (
					<div className="flex flex-col gap-3">
						{fields.map((field, idx) => (
							<div
								key={field.fieldId}
								className="grid grid-cols-[1fr_auto] items-start gap-3 rounded-xl bg-muted p-4"
							>
								<div className="flex flex-col gap-3">
									<div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr]">
										<FormInput
											inputName={`items.${idx}.title`}
											placeholder="e.g. Roofing"
											disabled={!itemsEditable}
										/>
										<FormInput
											inputName={`items.${idx}.targetAmount`}
											placeholder="0.00"
											type="number"
											disabled={!itemsEditable}
										/>
										<FormDatePicker
											inputName={`items.${idx}.deadline`}
											placeholder="Pick a date"
											disabled={!itemsEditable}
										/>
									</div>
									<FormInput
										inputName={`items.${idx}.description`}
										placeholder="Item description (optional)"
										disabled={!itemsEditable}
									/>
								</div>
								{itemsEditable && (
									<button
										type="button"
										aria-label="Remove item"
										onClick={() => remove(idx)}
										className="grid size-9 place-items-center rounded-full bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
									>
										<Icon name="trash" size={14} />
									</button>
								)}
							</div>
						))}
					</div>
				)}
			</Card>

			{errors.root?.message && (
				<div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
					{errors.root.message}
				</div>
			)}

			<div className="flex justify-end gap-2">
				<Button variant="tertiary" onClick={onCancel} disabled={isSubmitting}>
					Cancel
				</Button>
				<FormButton variant="primary" loadingLabel="Saving…">
					{submitLabel}
				</FormButton>
			</div>
		</Form>
	);
};
