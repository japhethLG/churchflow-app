"use client";

import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/primitives/Button";

type FormSubmitProps = {
	children: ReactNode;
	isLoading?: boolean;
	disabled?: boolean;
	variant?: "primary" | "secondary" | "tertiary";
	destructive?: boolean;
};

export const FormSubmit = ({
	children,
	isLoading,
	disabled,
	variant = "primary",
	destructive,
}: FormSubmitProps) => {
	const {
		formState: { isSubmitting },
	} = useFormContext();
	const busy = isLoading || isSubmitting;
	return (
		<Button
			type="submit"
			variant={variant}
			destructive={destructive}
			disabled={disabled || busy}
		>
			{busy ? "Saving…" : children}
		</Button>
	);
};
