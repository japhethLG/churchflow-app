"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import {
	DateRangePicker,
	type DateRangePickerProps,
	type DateRangeValue,
} from "@/components/primitives/DateRangePicker";

type FormDateRangePickerProps = Omit<
	DateRangePickerProps,
	"value" | "onChange" | "onBlur" | "error"
> & {
	inputName: string;
};

/**
 * FormDateRangePicker — Controller wrapper for DateRangePicker.
 * Stores { from: string, to: string } in form state.
 */
export const FormDateRangePicker = ({
	inputName,
	...rest
}: FormDateRangePickerProps) => {
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
				<DateRangePicker
					{...rest}
					value={
						(field.value as DateRangeValue) ?? {
							from: undefined,
							to: undefined,
						}
					}
					onChange={field.onChange}
					onBlur={field.onBlur}
					error={fieldError?.message as string | undefined}
				/>
			)}
		/>
	);
};
