"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Pressable } from "./Pressable";

export type SegmentedOption = {
	value: string;
	label: string;
};

export const SegmentedControl = ({
	options,
	value: controlledValue,
	defaultValue,
	onChange,
	className,
}: {
	options: SegmentedOption[];
	/** Controlled mode — component reflects this value */
	value?: string;
	/** Uncontrolled mode — component starts here and manages its own state */
	defaultValue?: string;
	onChange?: (value: string) => void;
	className?: string;
}) => {
	const [internal, setInternal] = useState(
		defaultValue ?? options[0]?.value ?? "",
	);

	const active = controlledValue ?? internal;

	const select = (v: string) => {
		if (controlledValue === undefined) {
			setInternal(v);
		}
		onChange?.(v);
	};

	return (
		<div
			className={cn(
				"inline-flex items-center gap-0.5 rounded-lg bg-secondary p-[3px]",
				className,
			)}
		>
			{options.map((opt) => (
				<Pressable
					key={opt.value}
					onClick={() => select(opt.value)}
					className={cn(
						"rounded-lg px-[14px] py-1 text-[13px] font-medium transition-all",
						active === opt.value
							? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
							: "text-muted-foreground",
					)}
				>
					{opt.label}
				</Pressable>
			))}
		</div>
	);
};
