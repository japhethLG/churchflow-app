"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import { AmountInput } from "@/components/primitives/AmountInput";

type FormAmountInputProps = {
  inputName: string;
  label?: string;
  currency?: string;
  placeholder?: string;
  step?: string;
  min?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  hint?: string;
};

export const FormAmountInput = ({
  inputName,
  hint,
  ...rest
}: FormAmountInputProps) => {
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
        <AmountInput
          {...rest}
          value={(field.value as string) ?? ""}
          onChange={field.onChange}
          onBlur={field.onBlur}
          hint={hint}
          error={errorMessage}
        />
      )}
    />
  );
};
