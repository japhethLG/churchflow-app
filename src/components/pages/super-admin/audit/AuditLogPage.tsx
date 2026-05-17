"use client";

import { useMemo, useState } from "react";
import {
	Badge,
	type BadgeColor,
	type DataTableColumn,
	DataTableShell,
	DateRangePicker,
	type DateRangeValue,
	PageHeader,
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
	const [search, setSearch] = useState("");
	const [actionFilter, setActionFilter] = useState<Action | "all">("all");
	const [entity, setEntity] = useState<string>("all");
	const [tenantId, setTenantId] = useState<string>("all");
	const [range, setRange] = useState<DateRangeValue>({});
	const [offset, setOffset] = useState(0);
	const [limit, setLimit] = useState(50);

	// Audit rows can reference deleted tenants — include tombstones so the
	// tenant column resolves uniformly across active and archived tenants.
	const tenantsQ = useTenants({ includeDeleted: true });
	const tenants = tenantsQ.data?.items ?? [];
	const tenantNameById = useMemo(() => {
		return new Map(tenants.map((t) => [t.id, t]));
	}, [tenants]);

	const auditQ = useAuditEvents({
		action: actionFilter === "all" ? undefined : actionFilter,
		entity: entity === "all" ? undefined : entity,
		tenantId: tenantId === "all" ? undefined : tenantId,
		dateFrom: range.from
			? dayjs.utc(range.from).startOf("day").toISOString()
			: undefined,
		dateTo: range.to
			? dayjs.utc(range.to).endOf("day").toISOString()
			: undefined,
		offset,
		limit,
	});
	const events: AuditEvent[] = auditQ.data?.items ?? [];
	const total = auditQ.data?.meta.total ?? 0;

	// Free-text actor search is client-side over the fetched page — the
	// backend keys on exact UID match, and an email-prefix LIKE would need
	// extra work to stay tenant-isolation safe.
	const visible = useMemo<AuditEvent[]>(() => {
		const needle = search.trim().toLowerCase();
		if (!needle) {
			return events;
		}
		return events.filter(
			(e) =>
				(nstr(e.actorEmail) ?? "").toLowerCase().includes(needle) ||
				e.actorUid.toLowerCase().includes(needle),
		);
	}, [events, search]);

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

	const resetOffset = () => setOffset(0);

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Platform"
				title="Audit log"
				subtitle="Every mutating action across the platform — append-only, never edited."
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<DataTableShell<AuditEvent>
					search={{
						value: search,
						onChange: setSearch,
						placeholder: "Filter by actor email or UID…",
					}}
					filters={[
						{
							key: "action",
							label: "Action",
							value: actionFilter,
							onChange: (v) => {
								setActionFilter(v as Action | "all");
								resetOffset();
							},
							options: ACTION_OPTIONS,
						},
						{
							key: "entity",
							label: "Entity",
							value: entity,
							onChange: (v) => {
								setEntity(v);
								resetOffset();
							},
							options: ENTITY_OPTIONS,
						},
						{
							key: "tenant",
							label: "Tenant",
							value: tenantId,
							onChange: (v) => {
								setTenantId(v);
								resetOffset();
							},
							options: [
								{ value: "all", label: "All tenants" },
								...tenants.map((t) => ({ value: t.id, label: t.name })),
							],
						},
					]}
					toolbar={
						<DateRangePicker
							value={range}
							onChange={(v) => {
								setRange(v);
								resetOffset();
							}}
							placeholder="Date range"
							size="sm"
							autoWidth
							clearable
						/>
					}
					onClearFilters={() => {
						setActionFilter("all");
						setEntity("all");
						setTenantId("all");
						setRange({});
						resetOffset();
					}}
					stats={[{ label: "events", value: total.toLocaleString() }]}
					columns={columns}
					rows={visible}
					rowKey={(e) => e.id}
					loading={auditQ.isLoading}
					emptyTitle="No audit events"
					emptySubtitle="Adjust the filters above — or perform an action that writes to the log."
					pagination={{
						total,
						offset,
						limit,
						onOffsetChange: setOffset,
						onLimitChange: setLimit,
						pageSizes: [25, 50, 100, 200],
					}}
				/>
			</div>
		</div>
	);
};
