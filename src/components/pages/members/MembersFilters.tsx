"use client";

import { Chip, Input } from "@/components/primitives";

export type MemberStatusFilter = "all" | "active" | "inactive";
export type MemberLinkedFilter = "all" | "linked" | "unlinked";

export type MembersFiltersValue = {
	search: string;
	status: MemberStatusFilter;
	linked: MemberLinkedFilter;
};

const STATUS_LABEL: Record<MemberStatusFilter, string> = {
	all: "Status: All",
	active: "Status: Active",
	inactive: "Status: Inactive",
};

const LINKED_LABEL: Record<MemberLinkedFilter, string> = {
	all: "All links",
	linked: "Registered only",
	unlinked: "Unregistered only",
};

const STATUS_CYCLE: MemberStatusFilter[] = ["all", "active", "inactive"];
const LINKED_CYCLE: MemberLinkedFilter[] = ["all", "linked", "unlinked"];

const next = <T,>(arr: readonly T[], v: T): T => {
	const i = arr.indexOf(v);
	return arr[(i + 1) % arr.length];
};

export const MembersFilters = ({
	value,
	onChange,
}: {
	value: MembersFiltersValue;
	onChange: (v: MembersFiltersValue) => void;
}) => {
	return (
		<div className="mb-4 flex flex-wrap items-center gap-2.5 rounded-2xl bg-muted p-3">
			<div className="min-w-[200px] max-w-[320px] flex-1">
				<Input
					icon="search"
					placeholder="Search by name or email…"
					value={value.search}
					onChange={(e) => onChange({ ...value, search: e.target.value })}
				/>
			</div>
			<span
				onClick={() =>
					onChange({ ...value, status: next(STATUS_CYCLE, value.status) })
				}
			>
				<Chip icon="chevronDown" active={value.status !== "all"}>
					{STATUS_LABEL[value.status]}
				</Chip>
			</span>
			<span
				onClick={() =>
					onChange({ ...value, linked: next(LINKED_CYCLE, value.linked) })
				}
			>
				<Chip icon="chevronDown" active={value.linked !== "all"}>
					{LINKED_LABEL[value.linked]}
				</Chip>
			</span>
		</div>
	);
};
