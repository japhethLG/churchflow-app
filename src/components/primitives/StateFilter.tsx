"use client";

import { SegmentedControl } from "./SegmentedControl";

// 3-state archive filter used on every admin list + inline on detail-page
// sub-tables. Maps a single string value to the `{ includeDeleted, onlyDeleted }`
// shape every list hook expects.
//
// Encoding:
//   "active"  → both flags omitted (default, BE returns active rows only)
//   "deleted" → onlyDeleted: true   (BE returns tombstones only)
//   "all"     → includeDeleted: true (BE returns active + tombstones)
export type StateFilterValue = "active" | "deleted" | "all";

export type StateFilterFlags = {
	includeDeleted?: boolean;
	onlyDeleted?: boolean;
};

export const toStateFilterFlags = (
	value: StateFilterValue,
): StateFilterFlags => {
	switch (value) {
		case "deleted":
			return { onlyDeleted: true };
		case "all":
			return { includeDeleted: true };
		default:
			return {};
	}
};

export type StateFilterProps = {
	value: StateFilterValue;
	onChange: (value: StateFilterValue) => void;
	className?: string;
};

export const StateFilter = ({
	value,
	onChange,
	className,
}: StateFilterProps) => {
	return (
		<SegmentedControl
			className={className}
			value={value}
			onChange={(v) => onChange(v as StateFilterValue)}
			options={[
				{ value: "active", label: "Active" },
				{ value: "deleted", label: "Deleted" },
				{ value: "all", label: "All" },
			]}
		/>
	);
};
