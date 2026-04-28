"use client";

import { Controller, get, useFormContext } from "react-hook-form";
import type { HTMLInputTypeAttribute } from "react";
import { Input } from "@/components/primitives/Input";
import type { IconName } from "@/components/primitives/Icon";

type FormInputProps = {
  inputName: string;
  label?: string;
  helper?: string;
  placeholder?: string;
  type?: HTMLInputTypeAttribute;
  icon?: IconName;
  prefix?: string;
  suffix?: string;
  disabled?: boolean;
  readOnly?: boolean;
};

export const FormInput = ({ inputName, helper, ...rest }: FormInputProps) => {
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
        <Input
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
