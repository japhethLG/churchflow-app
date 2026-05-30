"use client";

import { useMemo } from "react";
import {
	Badge,
	type BadgeColor,
	type DataTableColumn,
	DataTableShell,
	type DateRangeValue,
	ExpandableCard,
	PageHeader,
	useTableFilters,
} from "@/components/primitives";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { components } from "@/lib/api";
import { useAuditEvents } from "@/lib/api/audit";
import { nstr } from "@/lib/api/coerce";
import { useTenants } from "@/lib/api/tenants";
import dayjs from "@/lib/dayjs";

type AuditEvent = components["schemas"]["AuditEventResponseDto"];
type Action = AuditEvent["action"];

const ACTION_COLOR: Record<Action, BadgeColor> = {
	CREATE: "green",
	UPDATE: "blue",
	DELETE: "red",
	RESTORE: "amber",
	ROLE_CHANGE: "purple",
	MEMBERSHIP_CHANGE: "indigo",
};

const ACTION_LABEL: Record<Action, string> = {
	CREATE: "Create",
	UPDATE: "Update",
	DELETE: "Delete",
	RESTORE: "Restore",
	ROLE_CHANGE: "Role change",
	MEMBERSHIP_CHANGE: "Membership change",
};

const ACTION_OPTIONS = [
	{ value: "all", label: "All actions" },
	{ value: "CREATE", label: "Create" },
	{ value: "UPDATE", label: "Update" },
	{ value: "DELETE", label: "Delete" },
	{ value: "RESTORE", label: "Restore" },
	{ value: "ROLE_CHANGE", label: "Role change" },
	{ value: "MEMBERSHIP_CHANGE", label: "Membership change" },
];

// The entities super-admins are likely to scope by. Hard-coded so we don't
// hit a distinct-query endpoint just to populate the dropdown.
const ENTITY_OPTIONS = [
	{ value: "all", label: "All entities" },
	{ value: "Tenant", label: "Tenant" },
	{ value: "Member", label: "Member" },
	{ value: "Campaign", label: "Campaign" },
	{ value: "CampaignItem", label: "Campaign item" },
	{ value: "Pledge", label: "Pledge" },
	{ value: "Transaction", label: "Transaction" },
	{ value: "Invitation", label: "Invitation" },
	{ value: "User", label: "User" },
];

export const AuditLogPage = () => {
	const t = useTableFilters(
		{
			action: "all",
			entity: "all",
			tenant: "all",
			search: "",
			dateFrom: "",
			dateTo: "",
		},
		{ limit: 50 },
	);
	const range: DateRangeValue = {
		from: t.values.dateFrom || undefined,
		to: t.values.dateTo || undefined,
	};

	// Audit rows can reference deleted tenants — include tombstones so the
	// tenant column resolves uniformly across active and archived tenants.
	const tenantsQ = useTenants({ includeDeleted: true });
	const tenants = tenantsQ.data?.items ?? [];
	const tenantNameById = useMemo(() => {
		return new Map(tenants.map((tenant) => [tenant.id, tenant]));
	}, [tenants]);

	const auditQ = useAuditEvents({
		action: t.values.action === "all" ? undefined : (t.values.action as Action),
		entity: t.values.entity === "all" ? undefined : t.values.entity,
		tenantId: t.values.tenant === "all" ? undefined : t.values.tenant,
		dateFrom: range.from
			? dayjs.utc(range.from).startOf("day").toISOString()
			: undefined,
		dateTo: range.to
			? dayjs.utc(range.to).endOf("day").toISOString()
			: undefined,
		offset: t.offset,
		limit: t.limit,
	});
	const events: AuditEvent[] = auditQ.data?.items ?? [];
	const total = auditQ.data?.meta.total ?? 0;

	// Free-text actor search is client-side over the fetched page — the
	// backend keys on exact UID match, and an email-prefix LIKE would need
	// extra work to stay tenant-isolation safe.
	const visible = useMemo<AuditEvent[]>(() => {
		const needle = t.values.search.trim().toLowerCase();
		if (!needle) {
			return events;
		}
		return events.filter(
			(e) =>
				(nstr(e.actorEmail) ?? "").toLowerCase().includes(needle) ||
				e.actorUid.toLowerCase().includes(needle),
		);
	}, [events, t.values.search]);

	const columns: DataTableColumn<AuditEvent>[] = [
		{
			key: "when",
			label: "When",
			width: "180px",
			render: (e) => (
				<Tooltip>
					<TooltipTrigger
						render={
							<span className="text-sm text-muted-foreground">
								{dayjs(e.createdAt).fromNow()}
							</span>
						}
					/>
					<TooltipContent>
						{dayjs(e.createdAt).format("MMM D, YYYY · h:mm:ss A")}
					</TooltipContent>
				</Tooltip>
			),
		},
		{
			key: "action",
			label: "Action",
			width: "150px",
			render: (e) => (
				<Badge color={ACTION_COLOR[e.action]}>{ACTION_LABEL[e.action]}</Badge>
			),
		},
		{
			key: "entity",
			label: "Entity",
			width: "140px",
			render: (e) => (
				<div className="flex flex-col">
					<span className="text-sm font-medium">{e.entity}</span>
					<span className="text-[11px] text-muted-foreground font-mono">
						{e.entityId.slice(0, 8)}…
					</span>
				</div>
			),
		},
		{
			key: "summary",
			label: "Summary",
			render: (e) => {
				const summary = nstr(e.summary);
				return (
					<span className="text-sm text-foreground">
						{summary ?? (
							<span className="text-muted-foreground italic">No summary</span>
						)}
					</span>
				);
			},
		},
		{
			key: "tenant",
			label: "Tenant",
			width: "180px",
			render: (e) => {
				const tid = nstr(e.tenantId);
				if (!tid) {
					return (
						<span className="text-xs text-muted-foreground italic">
							Platform
						</span>
					);
				}
				const t = tenantNameById.get(tid);
				return (
					<span className="text-sm">
						{t ? (
							t.name
						) : (
							<span className="font-mono text-xs">{tid.slice(0, 8)}…</span>
						)}
					</span>
				);
			},
		},
		{
			key: "actor",
			label: "Actor",
			width: "240px",
			render: (e) => (
				<Tooltip>
					<TooltipTrigger
						render={
							<div className="flex flex-col">
								<span className="text-sm">{nstr(e.actorEmail) ?? "—"}</span>
								<span className="font-mono text-[11px] text-muted-foreground">
									{e.actorUid.slice(0, 12)}…
								</span>
							</div>
						}
					/>
					<TooltipContent>{e.actorUid}</TooltipContent>
				</Tooltip>
			),
		},
	];

	// Sub-`md` row → expandable card. Collapsed: action + entity + relative
	// time. Expanded: summary, tenant, actor.
	const renderAuditCard = (e: AuditEvent) => {
		const summary = nstr(e.summary);
		const tid = nstr(e.tenantId);
		const tenant = tid ? tenantNameById.get(tid) : null;
		return (
			<ExpandableCard
				details={[
					{
						label: "Summary",
						value: summary ? (
							<span className="text-sm font-medium text-foreground">
								{summary}
							</span>
						) : (
							<span className="text-sm italic text-muted-foreground">
								No summary
							</span>
						),
					},
					{
						label: "Tenant",
						value: !tid ? (
							<span className="text-sm italic text-muted-foreground">
								Platform
							</span>
						) : (
							<span className="text-sm font-medium text-foreground">
								{tenant ? tenant.name : `${tid.slice(0, 8)}…`}
							</span>
						),
					},
					{
						label: "Actor",
						value: (
							<span className="text-sm font-medium text-foreground">
								{nstr(e.actorEmail) ?? `${e.actorUid.slice(0, 12)}…`}
							</span>
						),
					},
				]}
			>
				<div className="flex items-center gap-3">
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<Badge color={ACTION_COLOR[e.action]}>
								{ACTION_LABEL[e.action]}
							</Badge>
							<span className="truncate text-sm font-semibold tracking-tight">
								{e.entity}
							</span>
						</div>
						<div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
							{e.entityId.slice(0, 8)}…
						</div>
					</div>
					<span className="shrink-0 text-xs text-muted-foreground">
						{dayjs(e.createdAt).fromNow()}
					</span>
				</div>
			</ExpandableCard>
		);
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Platform"
				title="Audit log"
				subtitle="Every mutating action across the platform — append-only, never edited."
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
				<DataTableShell<AuditEvent>
					search={t.search("Filter by actor email or UID…")}
					filters={[
						t.select("action", "Action", ACTION_OPTIONS),
						t.select("entity", "Entity", ENTITY_OPTIONS),
						t.select("tenant", "Tenant", [
							{ value: "all", label: "All tenants" },
							...tenants.map((tenant) => ({
								value: tenant.id,
								label: tenant.name,
							})),
						]),
						t.date("Date range"),
					]}
					onClearFilters={t.clear}
					stats={[{ label: "events", value: total.toLocaleString() }]}
					columns={columns}
					mobileCard={renderAuditCard}
					rows={visible}
					rowKey={(e) => e.id}
					loading={auditQ.isLoading}
					emptyTitle="No audit events"
					emptySubtitle="Adjust the filters above — or perform an action that writes to the log."
					pagination={t.pagination(total, { pageSizes: [25, 50, 100, 200] })}
				/>
			</div>
		</div>
	);
};
