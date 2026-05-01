"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import { DatePicker, type DatePickerProps } from "@/components/primitives/DatePicker";

type FormDatePickerProps = Omit<DatePickerProps, "value" | "onChange" | "onBlur" | "error"> & {
  inputName: string;
};

/**
 * FormDatePicker — react-hook-form Controller wrapper around DatePicker.
 * Stores the date as an ISO string ("YYYY-MM-DD") in the form state.
 */
export const FormDatePicker = ({ inputName, ...rest }: FormDatePickerProps) => {
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
        <DatePicker
          {...rest}
          value={(field.value as string) ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={fieldError?.message as string | undefined}
        />
      )}
    />
  );
};
