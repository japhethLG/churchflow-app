"use client";

import type { ComponentProps } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/primitives/Button";
import { useFormInternalContext } from "../Form";

type FormButtonProps = ComponentProps<typeof Button> & {
	/**
	 * If provided, the button will call form.handleSubmit with this function.
	 * This is useful for submit buttons that aren't of type="submit" (e.g. inside a div).
	 */
	onFormSubmit?: (values: any) => void | Promise<void>;
	/**
	 * Label to show when the form is submitting. Defaults to "Saving…".
	 */
	loadingLabel?: string;
};

export const FormButton = ({
	children,
	onFormSubmit,
	disabled,
	loadingLabel = "Saving…",
	onClick,
	type = "submit",
	...props
}: FormButtonProps) => {
	const {
		handleSubmit,
		formState: { isSubmitting },
	} = useFormContext();
	const formInternal = useFormInternalContext();

	// Resolve the click handler in priority order:
	// 1. onFormSubmit — explicit "submit my values via this fn" (validated).
	// 2. onClick — explicit imperative handler. Always wins over the implicit
	//    "fall back to the parent Form's onSubmit" so a FormButton can be
	//    used as an inline action inside a <Form> (e.g. "Save row", "Add
	//    another") without secretly triggering the outer form's submission.
	// 3. Parent Form's onSubmit — only when neither of the above is provided
	//    AND we either aren't a submit button OR we're outside a <Form>.
	const handleAction = onFormSubmit
		? handleSubmit(onFormSubmit)
		: onClick
			? onClick
			: formInternal?.onSubmit && (type !== "submit" || !formInternal)
				? handleSubmit(formInternal.onSubmit)
				: undefined;

	return (
		<Button
			{...props}
			type={type}
			onClick={handleAction}
			disabled={disabled || isSubmitting}
			loading={isSubmitting}
		>
			{isSubmitting ? loadingLabel : children}
		</Button>
	);
};
