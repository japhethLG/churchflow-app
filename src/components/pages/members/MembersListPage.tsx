"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import {
	Avatar,
	Badge,
	Button,
	type DataTableColumn,
	DataTableShell,
	ExpandableCard,
	PageHeader,
	Sparkline,
	useTableFilters,
} from "@/components/primitives";
import type { components } from "@/lib/api";
import { useMembers, useMembersGivingTrend } from "@/lib/api/members";
import dayjs from "@/lib/dayjs";
import { formatCompact } from "@/lib/format-currency";
import { useMobileActions } from "@/lib/mobile-actions/store";
import { openModal } from "@/lib/modals/store";

type Member = components["schemas"]["MemberResponseDto"];

type StatusFilter = "all" | "active" | "inactive";

const STATUS_OPTIONS = [
	{ value: "all", label: "All statuses" },
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
];

export const MembersListPage = () => {
	const router = useRouter();
	const { tenantSlug } = useParams<{ tenantSlug: string }>();

	const t = useTableFilters({ status: "all", state: "active", search: "" });
	const status = t.values.status as StatusFilter;

	const { data, isLoading } = useMembers(tenantSlug, {
		status:
			status === "all"
				? undefined
				: status === "active"
					? "ACTIVE"
					: "INACTIVE",
		search: t.values.search.trim() || undefined,
		offset: t.offset,
		limit: t.limit,
		...t.stateFlags(),
	});

	const members: Member[] = data?.items ?? [];
	const total = data?.meta.total ?? 0;

	// Per-member 12-month sparkline series — a single server-side rollup
	// scoped to the members on THIS page, replacing the old fetch-500-
	// transactions-and-bucket-in-JS approach (which silently truncated at
	// 500 rows for high-traffic tenants).
	const visibleMemberIds = useMemo(() => members.map((m) => m.id), [members]);
	const trendQ = useMembersGivingTrend(tenantSlug, visibleMemberIds, 12);
	const sparkBuckets = useMemo(() => {
		const map: Record<string, number[]> = {};
		for (const item of trendQ.data?.items ?? []) {
			map[item.memberId] = item.monthlyTotals;
		}
		return map;
	}, [trendQ.data]);

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

	// Sub-`md` row → expandable card. Collapsed: identity + 12-mo sparkline +
	// total. Expanded: joined (+new), role, account-registration.
	const renderMemberCard = (m: Member) => {
		const name = `${m.firstName} ${m.lastName}`.trim() || "Unnamed";
		const series = sparkBuckets[m.id];
		const hasGiving = Boolean(series?.some((v) => v > 0));
		const isNew = dayjs(m.createdAt).isAfter(dayjs().subtract(30, "day"));
		return (
			<ExpandableCard
				href={`/${tenantSlug}/admin/members/${m.id}`}
				deleted={Boolean(m.deletedAt)}
				details={[
					{
						label: "Joined",
						value: (
							<div className="flex items-center justify-end gap-2">
								<span className="text-sm font-medium text-foreground">
									{dayjs(m.createdAt).format("MMM D, YYYY")}
								</span>
								{isNew && <Badge color="green">new</Badge>}
							</div>
						),
					},
					{
						label: "Role",
						value: (
							<Badge color={m.role === "ADMIN" ? "indigo" : "neutral"}>
								{m.role}
							</Badge>
						),
					},
					{
						label: "Account",
						value: (
							<span className="text-sm font-medium text-foreground">
								{m.userId ? "Registered" : "Not registered"}
							</span>
						),
					},
				]}
			>
				<div className="flex items-center gap-3">
					<Avatar name={name} size={40} />
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold tracking-tight">
							{name}
						</div>
						<div className="truncate text-xs text-muted-foreground">
							{typeof m.email === "string" ? m.email : "—"}
						</div>
					</div>
					<div className="flex shrink-0 flex-col items-end gap-0.5">
						{hasGiving && series ? (
							<>
								<Sparkline
									data={series}
									width={58}
									height={20}
									tone="current"
								/>
								<span className="text-xs font-semibold tabular-nums">
									{formatCompact(series.reduce((s, v) => s + v, 0))}
								</span>
							</>
						) : (
							<span className="text-xs text-muted-foreground">no giving</span>
						)}
					</div>
				</div>
			</ExpandableCard>
		);
	};

	useMobileActions(
		useMemo(
			() => [
				{
					label: "Add member",
					icon: "plus" as const,
					onClick: () => openModal("add-member", { tenantSlug }),
				},
				{
					label: "Invite",
					icon: "mail" as const,
					onClick: () => openModal("invite-member", { tenantId: tenantSlug }),
				},
			],
			[tenantSlug],
		),
	);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Directory"
				title="Members"
				subtitle="Everyone giving at this church — find them, see who's active."
				action={
					<>
						<Button
							role="secondary"
							recipe="outline"
							icon="mail"
							className="hidden md:inline-flex"
							onClick={() =>
								openModal("invite-member", { tenantId: tenantSlug })
							}
						>
							Invite
						</Button>
						<Button
							role="primary"
							icon="plus"
							className="hidden md:inline-flex"
							onClick={() => openModal("add-member", { tenantSlug })}
						>
							Add member
						</Button>
					</>
				}
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
				<DataTableShell<Member>
					search={t.search("Search by name or email…")}
					filters={[t.select("status", "Status", STATUS_OPTIONS), t.state()]}
					onClearFilters={t.clear}
					stats={[
						{ label: "total", value: total },
						{ label: "active", value: activeCount, tone: "success" },
						{ label: "registered", value: registeredCount },
						{ label: "new in 30d", value: newIn30d },
					]}
					columns={columns}
					mobileCard={renderMemberCard}
					rows={members}
					rowKey={(m) => m.id}
					loading={isLoading}
					onRowClick={(m) =>
						router.push(`/${tenantSlug}/admin/members/${m.id}`)
					}
					rowClassName={(m) => (m.deletedAt ? "bg-muted/30" : undefined)}
					emptyTitle="No members yet"
					emptySubtitle="Add or invite your first member to get started."
					pagination={t.pagination(total)}
				/>
			</div>
		</div>
	);
};
