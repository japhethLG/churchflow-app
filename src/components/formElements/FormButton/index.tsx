"use client";

import { useFormContext } from "react-hook-form";
import { Button } from "@/components/primitives/Button";
import { type ComponentProps } from "react";
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

  const effectiveSubmitHandler = onFormSubmit || formInternal?.onSubmit;

  // If it's a submit button inside a Form component, we let the form handle it.
  // Otherwise, if we have a handler and it's not a submit button (or we're not in a Form),
  // we trigger it manually.
  const shouldTriggerManually = effectiveSubmitHandler && (type !== "submit" || !formInternal);
  const handleAction = shouldTriggerManually ? handleSubmit(effectiveSubmitHandler) : onClick;

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
