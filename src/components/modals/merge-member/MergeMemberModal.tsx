"use client";

import { useMemo, useState } from "react";
import { Avatar, Badge, Input, Pressable } from "@/components/primitives";
import type { components } from "@/lib/api";
import {
	useMembers,
	useMergeMembers,
	useMergeMembersPreview,
} from "@/lib/api/members";
import type { ModalBaseProps } from "@/lib/modals/registry";
import { cn } from "@/lib/utils";
import { BaseModal } from "../BaseModal";

type Member = components["schemas"]["MemberResponseDto"];

declare module "@/lib/modals/registry" {
	interface ModalPropsMap {
		"merge-member": MergeMemberProps;
	}
}

export type MergeMemberProps = {
	tenantSlug: string;
	keep: Member;
	initialDropId?: string;
};

const fullName = (m: Member): string => {
	return `${m.firstName} ${m.lastName}`.trim();
};

const asString = (v: unknown): string | null => {
	return typeof v === "string" && v.length > 0 ? v : null;
};

export const MergeMemberModal = ({
	tenantSlug,
	keep,
	initialDropId,
	onClose,
}: MergeMemberProps & ModalBaseProps) => {
	const [dropId, setDropId] = useState<string | null>(initialDropId ?? null);
	const [search, setSearch] = useState("");
	const [error, setError] = useState<string | null>(null);

	const { data: candidates, isLoading: searching } = useMembers(
		tenantSlug,
		{ search: search.trim() || undefined, limit: 8 },
		!dropId,
	);
	const {
		data: preview,
		isLoading: previewing,
		error: previewError,
	} = useMergeMembersPreview(
		tenantSlug,
		keep.id,
		dropId ?? "",
		Boolean(dropId),
	);
	const { mutateAsync, isPending } = useMergeMembers(tenantSlug);

	const filteredCandidates = useMemo(() => {
		return (candidates?.items ?? []).filter((m) => m.id !== keep.id);
	}, [candidates, keep.id]);

	const handleMerge = async () => {
		if (!dropId) return;
		setError(null);
		try {
			await mutateAsync({
				params: { path: { tenantId: tenantSlug, id: keep.id } },
				body: { dropId },
			});
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to merge");
		}
	};

	return (
		<BaseModal
			overline="Directory"
			title={`Merge into ${fullName(keep)}`}
			size="lg"
			onClose={onClose}
			dismissible={!isPending}
			primaryAction={{
				label: "Merge",
				onClick: handleMerge,
				loading: isPending,
				disabled: !dropId || !preview || previewing,
				destructive: true,
			}}
			secondaryAction={{
				label: "Cancel",
				onClick: onClose,
				disabled: isPending,
			}}
		>
			<div className="flex flex-col gap-4">
				<KeeperRow keep={keep} />

				{!dropId ? (
					<PickDuplicate
						search={search}
						onSearch={setSearch}
						candidates={filteredCandidates}
						loading={searching}
						onPick={setDropId}
					/>
				) : (
					<>
						{previewing && <SkeletonPreview />}
						{previewError && (
							<p className="m-0 text-sm text-destructive">
								{previewError instanceof Error
									? previewError.message
									: "Failed to load preview"}
							</p>
						)}
						{preview && (
							<Preview
								drop={preview.drop as Member}
								keep={preview.keep as Member}
								txCount={preview.transactionsToMove}
								pledgeCount={preview.pledgesToMove}
								fields={preview.fieldsCopiedFromDrop}
								onPickAgain={() => setDropId(null)}
							/>
						)}
					</>
				)}

				{error && <p className="m-0 text-sm text-destructive">{error}</p>}

				<p className="m-0 text-xs leading-normal text-muted-foreground">
					Merging is logged to the audit trail. The dropped profile is
					soft-deleted — if anything looks wrong after, support can recover it.
				</p>
			</div>
		</BaseModal>
	);
};

const KeeperRow = ({ keep }: { keep: Member }) => {
	return (
		<div className="flex items-center gap-3 rounded-xl bg-input px-3.5 py-3">
			<Avatar name={fullName(keep)} size={40} />
			<div className="min-w-0 flex-1">
				<div className="text-sm font-semibold">{fullName(keep)}</div>
				<div className="text-xs text-muted-foreground">
					Keeper — this profile stays
				</div>
			</div>
			<Badge color={keep.userId ? "indigo" : "clay"}>
				{keep.userId ? "Linked" : "Temp"}
			</Badge>
		</div>
	);
};

const PickDuplicate = ({
	search,
	onSearch,
	candidates,
	loading,
	onPick,
}: {
	search: string;
	onSearch: (v: string) => void;
	candidates: Member[];
	loading: boolean;
	onPick: (id: string) => void;
}) => {
	return (
		<div className="flex flex-col gap-3">
			<div>
				<div className="mb-2 text-[13px] font-medium text-secondary-foreground">
					Pick the duplicate to merge
				</div>
				<Input
					icon="search"
					placeholder="Search by name or email…"
					value={search}
					onChange={(e) => onSearch(e.target.value)}
				/>
			</div>
			<div className="max-h-[280px] overflow-auto rounded-xl bg-muted p-1.5">
				{loading && (
					<div className="p-4 text-center text-[13px] text-muted-foreground">
						Loading…
					</div>
				)}
				{!loading && candidates.length === 0 && (
					<div className="p-4 text-center text-[13px] text-muted-foreground">
						No other members match.
					</div>
				)}
				{!loading &&
					candidates.map((m) => (
						<Pressable
							key={m.id}
							onClick={() => onPick(m.id)}
							className={cn(
								"flex w-full items-center gap-3 rounded-lg border-0 px-3 py-2.5 text-foreground transition-colors hover:bg-input",
							)}
						>
							<Avatar name={fullName(m)} size={32} />
							<div className="min-w-0 flex-1">
								<div className="text-sm font-medium">{fullName(m)}</div>
								<div className="text-xs text-muted-foreground">
									{asString(m.email) ?? asString(m.phone) ?? "—"}
								</div>
							</div>
							<Badge color={m.userId ? "indigo" : "clay"}>
								{m.userId ? "Linked" : "Temp"}
							</Badge>
						</Pressable>
					))}
			</div>
		</div>
	);
};

const Preview = ({
	drop,
	keep,
	txCount,
	pledgeCount,
	fields,
	onPickAgain,
}: {
	drop: Member;
	keep: Member;
	txCount: number;
	pledgeCount: number;
	fields: Array<"email" | "phone" | "address" | "userId">;
	onPickAgain: () => void;
}) => {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-3 rounded-xl border border-destructive/25 bg-muted px-3.5 py-3">
				<Avatar name={fullName(drop)} size={40} />
				<div className="min-w-0 flex-1">
					<div className="text-sm font-semibold">{fullName(drop)}</div>
					<div className="text-xs text-muted-foreground">
						Will be removed — data moves into {fullName(keep)}
					</div>
				</div>
				<Pressable
					onClick={onPickAgain}
					className="text-[13px] font-medium text-primary hover:underline"
				>
					Change
				</Pressable>
			</div>

			<div className="flex flex-col gap-2.5 rounded-xl border border-border bg-card p-4">
				<div className="text-[13px] font-semibold text-secondary-foreground">
					What will move
				</div>
				<Row label="Transactions" value={txCount.toString()} />
				<Row label="Pledges" value={pledgeCount.toString()} />
				{fields.length > 0 && (
					<Row label="Fields copied to keeper" value={fields.join(", ")} />
				)}
				{fields.length === 0 && (
					<Row
						label="Fields copied to keeper"
						value="None — keeper already has them"
						muted
					/>
				)}
			</div>
		</div>
	);
};

const Row = ({
	label,
	value,
	muted,
}: {
	label: string;
	value: string;
	muted?: boolean;
}) => {
	return (
		<div className="flex justify-between text-[13px]">
			<span className="text-secondary-foreground">{label}</span>
			<span
				className={cn(
					"font-medium tabular-nums",
					muted ? "text-muted-foreground" : "text-foreground",
				)}
			>
				{value}
			</span>
		</div>
	);
};

const SkeletonPreview = () => {
	return <div className="h-[140px] rounded-xl bg-secondary" />;
};
