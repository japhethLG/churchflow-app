"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import {
	type MemberOption,
	MemberPicker,
} from "@/components/primitives/MemberPicker";

type FormMemberPickerProps = {
	inputName: string;
	label?: string;
	members: MemberOption[];
	placeholder?: string;
	emptyHint?: string;
	variant?: "inline" | "dropdown";
	maxResults?: number;
	hint?: string;
};

export const FormMemberPicker = ({
	inputName,
	hint,
	...rest
}: FormMemberPickerProps) => {
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
				<MemberPicker
					{...rest}
					value={(field.value as string) ?? ""}
					onChange={field.onChange}
					hint={hint}
					error={errorMessage}
				/>
			)}
		/>
	);
};
