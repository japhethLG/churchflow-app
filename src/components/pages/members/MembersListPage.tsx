"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	Avatar,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	PageHeader,
	Sparkline,
	type StateFilterValue,
	toStateFilterFlags,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMembers } from "@/lib/api/members";
import { useTransactions } from "@/lib/api/transactions";
import dayjs from "@/lib/dayjs";
import { formatCompact } from "@/lib/format-currency";
import { openModal } from "@/lib/modals/store";
import { num } from "../admin-shared";

type Member = components["schemas"]["MemberResponseDto"];

type StatusFilter = "all" | "active" | "inactive";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
];

// Build a 12-bucket monthly series per member from a flat transaction list.
// Bucket index 0 = 11 months ago, bucket 11 = current month.
const buildMonthlyByMember = (
	transactions: components["schemas"]["TransactionResponseDto"][],
): Record<string, number[]> => {
	const buckets: Record<string, number[]> = {};
	const startMonth = dayjs().startOf("month").subtract(11, "month");
	for (const t of transactions) {
		const mid = typeof t.memberId === "string" ? t.memberId : null;
		if (!mid) {
			continue;
		}
		const monthDelta = dayjs(t.date).startOf("month").diff(startMonth, "month");
		if (monthDelta < 0 || monthDelta > 11) {
			continue;
		}
		const arr = buckets[mid] ?? Array.from({ length: 12 }, () => 0);
		arr[monthDelta] = (arr[monthDelta] ?? 0) + num(t.amount);
		buckets[mid] = arr;
	}
	return buckets;
};

export const MembersListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<StatusFilter>("all");
	const [state, setState] = useState<StateFilterValue>("active");
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(20);

	const { data, isLoading } = useMembers(tenantSlug, {
		status:
			status === "all"
				? undefined
				: status === "active"
					? "ACTIVE"
					: "INACTIVE",
		search: search.trim() || undefined,
		offset,
		limit,
		...toStateFilterFlags(state),
	});

	// Last 12 months of transactions, used to build per-member sparkline.
	// At 500-row cap, this is preview-quality; at scale we'd want a backend
	// `members/giving-trend?months=12` rollup. Flagged in the index page.
	const yearFrom = dayjs().subtract(11, "month").startOf("month").toISOString();
	const txQ = useTransactions(tenantSlug, {
		dateFrom: yearFrom,
		limit: 500,
	});

	const sparkBuckets = useMemo(
		() => buildMonthlyByMember(txQ.data?.items ?? []),
		[txQ.data],
	);

	const members: Member[] = data?.items ?? [];
	const total = data?.meta.total ?? 0;

	const newIn30d = useMemo(
		() =>
			members.filter((m) =>
				dayjs(m.createdAt).isAfter(dayjs().subtract(30, "day")),
			).length,
		[members],
	);
	const activeCount = members.filter((m) => m.status === "ACTIVE").length;
	const registeredCount = members.filter((m) => m.userId).length;

	const columns: DataTableColumn<Member>[] = [
		{
			key: "member",
			label: "Member",
			render: (m) => {
				const name = `${m.firstName} ${m.lastName}`.trim() || "Unnamed";
				return (
					<div className="flex items-center gap-2.5">
						<Avatar name={name} size={32} />
						<div>
							<div className="text-sm font-medium text-foreground">{name}</div>
							<div className="text-xs text-muted-foreground">
								{typeof m.email === "string" ? m.email : "—"}
							</div>
						</div>
					</div>
				);
			},
		},
		{
			key: "trend",
			label: "Last 12mo",
			width: "120px",
			render: (m) => {
				const series = sparkBuckets[m.id];
				if (!series || series.every((v) => v === 0)) {
					return (
						<span className="text-xs text-muted-foreground">no giving</span>
					);
				}
				const sum = series.reduce((s, v) => s + v, 0);
				return (
					<div className="flex items-center gap-2">
						<Sparkline data={series} width={72} height={22} tone="current" />
						<span className="text-xs tabular-nums text-muted-foreground">
							{formatCompact(sum)}
						</span>
					</div>
				);
			},
		},
		{
			key: "joined",
			label: "Joined",
			width: "120px",
			render: (m) => {
				const isNew = dayjs(m.createdAt).isAfter(dayjs().subtract(30, "day"));
				return (
					<div className="text-xs">
						<div className="text-muted-foreground">
							{dayjs(m.createdAt).format("MMM D, YYYY")}
						</div>
						{isNew && (
							<Badge color="green" className="mt-0.5">
								new
							</Badge>
						)}
					</div>
				);
			},
		},
		{
			key: "role",
			label: "Role",
			width: "90px",
			render: (m) => (
				<Badge color={m.role === "ADMIN" ? "indigo" : "neutral"}>
					{m.role}
				</Badge>
			),
		},
		{
			key: "status",
			label: "Status",
			width: "100px",
			render: (m) => (
				<Badge color={m.status === "ACTIVE" ? "green" : "neutral"}>
					{m.status}
				</Badge>
			),
		},
	];

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Directory"
				title="Members"
				subtitle="Everyone giving at this church — find them, see who's active."
				action={
					<>
						<Button
							role="secondary"
							recipe="outline"
							icon="mail"
							onClick={() =>
								openModal("invite-member", { tenantId: tenantSlug })
							}
						>
							Invite
						</Button>
						<Button
							role="primary"
							icon="plus"
							onClick={() => openModal("add-member", { tenantSlug })}
						>
							Add member
						</Button>
					</>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<Member>
					search={{
						value: search,
						onChange: (v) => {
							setSearch(v);
							setOffset(0);
						},
						placeholder: "Search by name or email…",
					}}
					filters={[
						{
							key: "status",
							label: "Status",
							value: status,
							onChange: (v) => {
								setStatus(v as StatusFilter);
								setOffset(0);
							},
							options: STATUS_OPTIONS,
						},
					]}
					onClearFilters={() => setStatus("all")}
					state={{
						value: state,
						onChange: (v) => {
							setState(v);
							setOffset(0);
						},
					}}
					stats={[
						{ label: "total", value: total },
						{ label: "active", value: activeCount, tone: "success" },
						{ label: "registered", value: registeredCount },
						{ label: "new in 30d", value: newIn30d },
					]}
					columns={columns}
					rows={members}
					rowKey={(m) => m.id}
					loading={isLoading}
					onRowClick={(m) =>
						router.push(`/${tenantSlug}/admin/members/${m.id}`)
					}
					rowClassName={(m) => (m.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No members yet"
					emptySubtitle="Add or invite your first member to get started."
					pagination={{
						total,
						offset,
						limit,
						onOffsetChange: setOffset,
						onLimitChange: setLimit,
					}}
				/>
			</div>
		</div>
	);
};
