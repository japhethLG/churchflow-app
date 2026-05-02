"use client";

import { type ReactNode, useId } from "react";
import { Input, Pressable } from "@/components/primitives";
import { cn } from "@/lib/utils";

export type ReconcileChoice = "existing" | "sso" | "edit";

export type FieldReconcilerProps = {
	label: string;
	existing: string | null;
	sso: string | null;
	choice: ReconcileChoice;
	edited: string;
	onChange: (next: { choice: ReconcileChoice; edited: string }) => void;
	hint?: ReactNode;
};

export const FieldReconciler = ({
	label,
	existing,
	sso,
	choice,
	edited,
	onChange,
	hint,
}: FieldReconcilerProps) => {
	const id = useId();
	const hasExisting = Boolean(existing && existing.length > 0);
	const hasSso = Boolean(sso && sso.length > 0);

	return (
		<div className="flex flex-col gap-2">
			<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
			<div className="grid grid-cols-2 gap-2">
				<Option
					name={id}
					label="Keep existing"
					value={existing ?? "—"}
					disabled={!hasExisting}
					selected={choice === "existing"}
					onSelect={() =>
						onChange({ choice: "existing", edited: existing ?? "" })
					}
				/>
				<Option
					name={id}
					label="Use Google"
					value={sso ?? "—"}
					disabled={!hasSso}
					selected={choice === "sso"}
					onSelect={() => onChange({ choice: "sso", edited: sso ?? "" })}
				/>
			</div>
			<Pressable
				onClick={() => onChange({ choice: "edit", edited })}
				className={cn(
					"self-start border-none bg-transparent p-0 font-inherit text-xs font-medium underline decoration-dotted",
					choice === "edit" ? "text-primary" : "text-muted-foreground",
				)}
			>
				Or write something different
			</Pressable>
			{choice === "edit" && (
				<Input
					value={edited}
					onChange={(e) => onChange({ choice: "edit", edited: e.target.value })}
				/>
			)}
			{hint && <div className="text-xs text-muted-foreground">{hint}</div>}
		</div>
	);
};

const Option = ({
	name,
	label,
	value,
	disabled,
	selected,
	onSelect,
}: {
	name: string;
	label: string;
	value: string;
	disabled: boolean;
	selected: boolean;
	onSelect: () => void;
}) => {
	return (
		<Pressable
			disabled={disabled}
			onClick={onSelect}
			aria-pressed={selected}
			data-name={name}
			className={cn(
				"min-w-0 rounded-xl border-[1.5px] px-3 py-2.5 text-left font-inherit",
				selected ? "border-primary bg-accent" : "border-transparent bg-input",
				disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
			)}
		>
			<div className="mb-0.5 text-[11px] text-muted-foreground">{label}</div>
			<div className="truncate text-sm font-medium text-foreground">
				{value}
			</div>
		</Pressable>
	);
};
