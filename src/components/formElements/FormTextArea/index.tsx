"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import { Textarea } from "@/components/primitives/Textarea";

type FormTextAreaProps = {
	inputName: string;
	label?: string;
	helper?: string;
	placeholder?: string;
	rows?: number;
	disabled?: boolean;
	readOnly?: boolean;
};

export const FormTextArea = ({
	inputName,
	helper,
	...rest
}: FormTextAreaProps) => {
	const {
		control,
		formState: { errors },
	} = useFormContext();
	const fieldError = get(errors, inputName);

	return (
		<Controller
			control={control}
			name={inputName}
			render={({ field }) => (
				<Textarea
					{...rest}
					value={field.value ?? ""}
					onChange={(e) => field.onChange(e.target.value)}
					onBlur={field.onBlur}
					error={fieldError?.message as string | undefined}
					helper={helper}
				/>
			)}
		/>
	);
};
