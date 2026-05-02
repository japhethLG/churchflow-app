"use client";

import { createContext, type ReactNode, useContext } from "react";
import {
	type FieldValues,
	FormProvider,
	type SubmitHandler,
	type UseFormReturn,
} from "react-hook-form";
import { cn } from "@/lib/utils";

type FormInternalContextValue = {
	onSubmit: SubmitHandler<any>;
};

const FormInternalContext = createContext<FormInternalContextValue | null>(
	null,
);

export const useFormInternalContext = () => useContext(FormInternalContext);

type FormProps<T extends FieldValues> = {
	methods: UseFormReturn<T, any, any>;
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
		<FormInternalContext.Provider
			value={{ onSubmit: onSubmit as SubmitHandler<any> }}
		>
			<form
				className={cn("flex w-full flex-col gap-4", className)}
				onSubmit={methods.handleSubmit(onSubmit)}
				noValidate
			>
				{children}
			</form>
		</FormInternalContext.Provider>
	</FormProvider>
);
