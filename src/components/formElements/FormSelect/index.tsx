"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import { Select, type SelectOption } from "@/components/primitives/Select";

type FormSelectProps = {
	inputName: string;
	label?: string;
	options: SelectOption[];
	placeholder?: string;
	hint?: string;
	disabled?: boolean;
	size?: "sm" | "md";
	showEmptyOption?: boolean;
	emptyOptionLabel?: string;
};

export const FormSelect = ({ inputName, hint, ...rest }: FormSelectProps) => {
	const {
		control,
		formState: { errors },
	} = useFormContext();
	const fieldError = get(errors, inputName);
	const errorMessage = fieldError?.message as string | undefined;

	return (
		<Controller
			control={control}
			name={inputName}
			render={({ field }) => (
				<Select
					{...rest}
					value={field.value ?? ""}
					onChange={field.onChange}
					hint={errorMessage ?? hint}
				/>
			)}
		/>
	);
};
