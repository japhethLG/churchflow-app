"use client";

import {
  FormProvider,
  type FieldValues,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormProps<T extends FieldValues> = {
  methods: UseFormReturn<T>;
  onSubmit: SubmitHandler<T>;
  children: ReactNode;
  className?: string;
};

export const Form = <T extends FieldValues>({
  methods,
  onSubmit,
  children,
  className,
}: FormProps<T>) => (
  <FormProvider {...methods}>
    <form
      className={cn("flex w-full flex-col gap-4", className)}
      onSubmit={methods.handleSubmit(onSubmit)}
      noValidate
    >
      {children}
    </form>
  </FormProvider>
);
