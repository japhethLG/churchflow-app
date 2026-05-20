"use client";

import type { ReactNode } from "react";
import { useFormContext } from "react-hook-form";
import {
	Button,
	type ButtonRecipe,
	type ButtonRole,
} from "@/components/primitives/Button";

type FormSubmitProps = {
	children: ReactNode;
	isLoading?: boolean;
	disabled?: boolean;
	role?: ButtonRole;
	recipe?: ButtonRecipe;
};

export const FormSubmit = ({
	children,
	isLoading,
	disabled,
	role = "primary",
	recipe,
}: FormSubmitProps) => {
	const {
		formState: { isSubmitting },
	} = useFormContext();
	const busy = isLoading || isSubmitting;
	return (
		<Button
			type="submit"
			role={role}
			recipe={recipe}
			disabled={disabled || busy}
		>
			{busy ? "Saving…" : children}
		</Button>
	);
};
