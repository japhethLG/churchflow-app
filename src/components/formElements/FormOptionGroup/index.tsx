"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import {
  OptionGroup,
  type OptionGroupOption,
  type OptionGroupVariant,
} from "@/components/primitives/OptionGroup";

type FormOptionGroupProps = {
  inputName: string;
  label?: string;
  options: OptionGroupOption[];
  variant?: OptionGroupVariant;
  columns?: number;
  hint?: string;
  disabled?: boolean;
  className?: string;
};

export const FormOptionGroup = ({
  inputName,
  hint,
  ...rest
}: FormOptionGroupProps) => {
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
        <OptionGroup
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
