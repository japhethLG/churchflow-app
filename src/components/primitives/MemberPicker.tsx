"use client";

import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import type { components } from "@/lib/api";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Input } from "./Input";
import { ListRow } from "./ListRow";

export type MemberOption = Pick<
	components["schemas"]["MemberResponseDto"],
	"id" | "firstName" | "lastName" | "email" | "phone"
>;

const asString = (v: unknown): string | null =>
	typeof v === "string" && v.length > 0 ? v : null;

export type MemberPickerProps = {
	label?: string;
	value: string;
	onChange: (memberId: string) => void;
	members: MemberOption[];
	placeholder?: string;
	emptyHint?: string;
	variant?: "inline" | "dropdown";
	maxResults?: number;
	hint?: string;
	error?: string;
};

const fullName = (m: MemberOption): string => `${m.firstName} ${m.lastName}`;

const matchesQuery = (m: MemberOption, q: string): boolean => {
	const haystack =
		`${m.firstName} ${m.lastName} ${asString(m.email) ?? ""}`.toLowerCase();
	return haystack.includes(q);
};

export const MemberPicker = ({
	label,
	value,
	onChange,
	members,
	placeholder = "Search by name or email…",
	emptyHint,
	variant = "inline",
	maxResults = 8,
	hint,
	error,
}: MemberPickerProps) => {
	const [search, setSearch] = useState("");
	const memberById = useMemo(
		() => Object.fromEntries(members.map((m) => [m.id, m])),
		[members],
	);
	const chosen = value ? memberById[value] : undefined;

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return members.slice(0, maxResults);
		return members.filter((m) => matchesQuery(m, q)).slice(0, maxResults);
	}, [members, search, maxResults]);

	const showDropdownResults =
		variant === "dropdown" && search.trim().length > 0;
	const showInlineResults = variant === "inline" && !chosen;

	return (
		<div className="flex flex-col gap-2">
			{label && (
				<Label className="text-[13px] font-medium text-muted-foreground ml-1">
					{label}
				</Label>
			)}

			{chosen ? (
				<div className="flex items-center gap-3 rounded-xl bg-muted p-3">
					<Avatar name={fullName(chosen)} size={36} />
					<div className="min-w-0 flex-1">
						<div className="text-sm font-medium">{fullName(chosen)}</div>
						<div className="text-xs text-muted-foreground">
							{asString(chosen.email) ?? "no email"}
						</div>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							onChange("");
							setSearch("");
						}}
					>
						Change
					</Button>
				</div>
			) : (
				<div className="relative">
					<Input
						icon="search"
						placeholder={placeholder}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>

					{showDropdownResults && (
						<div className="absolute left-0 right-0 top-full z-1 mt-1 max-h-[200px] overflow-y-auto rounded-xl border border-border bg-card shadow-md">
							{filtered.length === 0 ? (
								<div className="p-3 text-center text-xs text-muted-foreground">
									No matches
								</div>
							) : (
								filtered.map((m) => (
									<ListRow
										key={m.id}
										size="sm"
										onClick={() => {
											onChange(m.id);
											setSearch("");
										}}
									>
										<Avatar name={fullName(m)} size={24} />
										<span className="text-[13px]">{fullName(m)}</span>
									</ListRow>
								))
							)}
						</div>
					)}

					{showInlineResults && (
						<div className="mt-2 max-h-[220px] overflow-y-auto rounded-xl border border-border">
							{filtered.length === 0 ? (
								<div className="p-4 text-center text-[13px] text-muted-foreground">
									No matches
								</div>
							) : (
								filtered.map((m) => (
									<ListRow key={m.id} onClick={() => onChange(m.id)}>
										<Avatar name={fullName(m)} size={28} />
										<span className="text-sm">{fullName(m)}</span>
										<span className="ml-auto text-xs text-muted-foreground">
											{asString(m.email) ?? ""}
										</span>
									</ListRow>
								))
							)}
						</div>
					)}
				</div>
			)}

			{error ? (
				<p className="ml-1 text-[12px] text-destructive">{error}</p>
			) : (
				(hint || emptyHint) && (
					<p className="ml-1 text-[12px] text-muted-foreground">
						{hint ?? (chosen ? undefined : emptyHint)}
					</p>
				)
			)}
		</div>
	);
};
