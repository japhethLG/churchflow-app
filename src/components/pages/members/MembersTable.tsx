"use client";

import {
	Avatar,
	Badge,
	type DataTableColumn,
	DeletedLabel,
	Icon,
	RowActionsMenu,
	StatusBadge,
} from "@/components/primitives";
import type { components } from "@/lib/api";

export type MemberRow = components["schemas"]["MemberResponseDto"];

export type MembersTableHandlers = {
	onView: (m: MemberRow) => void;
	onEdit: (m: MemberRow) => void;
	onDelete: (m: MemberRow) => void;
	onClaimInvite: (m: MemberRow) => void;
	onMerge: (m: MemberRow) => void;
	onRestore: (m: MemberRow) => void;
};

const fullName = (m: MemberRow): string => {
	return `${m.firstName} ${m.lastName}`.trim();
};

const MemberCell = ({ m }: { m: MemberRow }) => {
	const isLinked = Boolean(m.userId);
	const isDeleted = Boolean(m.deletedAt);
	return (
		<span className="inline-flex min-w-0 items-center gap-2.5">
			<Avatar name={fullName(m)} size={32} />
			{isDeleted ? (
				<DeletedLabel deletedAt={m.deletedAt} className="truncate font-medium">
					{fullName(m)}
				</DeletedLabel>
			) : (
				<span className="truncate font-medium">{fullName(m)}</span>
			)}
			{!isLinked && !isDeleted && <Badge color="clay">temp</Badge>}
		</span>
	);
};

const plainStr = (v: unknown): string | null => {
	return typeof v === "string" && v.length > 0 ? v : null;
};

const primary = "var(--primary)";

export const memberColumns = (
	handlers: MembersTableHandlers,
): DataTableColumn<MemberRow>[] => [
	{ key: "member", label: "Member", render: (m) => <MemberCell m={m} /> },
	{
		key: "email",
		label: "Email",
		width: "240px",
		render: (m) => {
			const v = plainStr(m.email);
			return <span className="text-muted-foreground">{v ?? "—"}</span>;
		},
	},
	{
		key: "phone",
		label: "Phone",
		width: "150px",
		render: (m) => {
			const v = plainStr(m.phone);
			return <span className="text-muted-foreground">{v ?? "—"}</span>;
		},
	},
	{
		key: "role",
		label: "Role",
		width: "100px",
		render: (m) => (
			<Badge color={m.role === "ADMIN" ? "indigo" : "neutral"}>{m.role}</Badge>
		),
	},
	{
		key: "status",
		label: "Status",
		width: "110px",
		render: (m) => (
			<StatusBadge status={m.status === "ACTIVE" ? "Active" : "Inactive"} />
		),
	},
	{
		key: "linked",
		label: "Linked",
		width: "80px",
		align: "center",
		render: (m) =>
			m.userId ? (
				<Icon name="check" size={18} color={primary} />
			) : (
				<span className="inline-block size-[18px] rounded-full bg-input" />
			),
	},
	{
		key: "actions",
		label: "",
		width: "48px",
		align: "right",
		overflow: "visible",
		render: (m) => {
			if (m.deletedAt) {
				return (
					<RowActionsMenu
						actions={[
							{ label: "View profile", onClick: () => handlers.onView(m) },
							{
								label: "Restore",
								onClick: () => handlers.onRestore(m),
								separatorBefore: true,
							},
						]}
					/>
				);
			}
			const isTemp = !m.userId;
			const actions = [
				{ label: "View profile", onClick: () => handlers.onView(m) },
				{ label: "Edit", onClick: () => handlers.onEdit(m) },
				...(isTemp
					? [
							{
								label: "Send sign-in invite",
								onClick: () => handlers.onClaimInvite(m),
								separatorBefore: true,
							},
						]
					: []),
				{
					label: "Merge with another…",
					onClick: () => handlers.onMerge(m),
					separatorBefore: !isTemp,
				},
				{
					label: "Remove",
					onClick: () => handlers.onDelete(m),
					destructive: true,
					separatorBefore: true,
				},
			];
			return <RowActionsMenu actions={actions} />;
		},
	},
];
