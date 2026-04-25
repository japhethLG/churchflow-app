"use client";

import { useMemo, useState } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
import { Avatar, Badge, Input } from "@/components/primitives";
import { useMembers, useMergeMembers, useMergeMembersPreview } from "@/lib/api/members";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";
import type { components } from "@/lib/api";

type Member = components["schemas"]["MemberResponseDto"];

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "merge-member": MergeMemberProps;
  }
}

export type MergeMemberProps = {
  tenantSlug: string;
  keep: Member;
  // Optional: pre-select the member to drop. Otherwise the admin picks
  // from a search list inside the modal.
  initialDropId?: string;
};

const fullName = (m: Member): string  => {
  return `${m.firstName} ${m.lastName}`.trim();
}

const asString = (v: unknown): string | null  => {
  return typeof v === "string" && v.length > 0 ? v : null;
}

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
  const { data: preview, isLoading: previewing, error: previewError } =
    useMergeMembersPreview(tenantSlug, keep.id, dropId ?? "", Boolean(dropId));
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
  }

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
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              <p style={{ margin: 0, fontSize: 13, color: S.error }}>
                {previewError instanceof Error ? previewError.message : "Failed to load preview"}
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

        {error && <p style={{ margin: 0, fontSize: 13, color: S.error }}>{error}</p>}

        <p style={{ margin: 0, fontSize: 12, color: S.onSurfaceMuted, lineHeight: 1.5 }}>
          Merging is logged to the audit trail. The dropped profile is soft-deleted —
          if anything looks wrong after, support can recover it.
        </p>
      </div>
    </BaseModal>
  );
}

const KeeperRow = ({ keep }: { keep: Member }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 12,
        background: S.surfaceContainerHigh,
      }}
    >
      <Avatar name={fullName(keep)} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{fullName(keep)}</div>
        <div style={{ fontSize: 12, color: S.onSurfaceMuted }}>
          Keeper — this profile stays
        </div>
      </div>
      <Badge color={keep.userId ? "indigo" : "clay"}>{keep.userId ? "Linked" : "Temp"}</Badge>
    </div>
  );
}

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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: S.onSurfaceVariant, marginBottom: 8 }}>
          Pick the duplicate to merge
        </div>
        <Input
          icon="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <div
        style={{
          background: S.surfaceContainerLow,
          borderRadius: 12,
          padding: 6,
          maxHeight: 280,
          overflow: "auto",
        }}
      >
        {loading && (
          <div style={{ padding: 16, fontSize: 13, color: S.onSurfaceMuted, textAlign: "center" }}>
            Loading…
          </div>
        )}
        {!loading && candidates.length === 0 && (
          <div style={{ padding: 16, fontSize: 13, color: S.onSurfaceMuted, textAlign: "center" }}>
            No other members match.
          </div>
        )}
        {!loading &&
          candidates.map((m) => (
            <button
              key={m.id}
              onClick={() => onPick(m.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                background: "transparent",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                color: S.onSurface,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = S.surfaceContainerHigh;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <Avatar name={fullName(m)} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{fullName(m)}</div>
                <div style={{ fontSize: 12, color: S.onSurfaceMuted }}>
                  {asString(m.email) ?? asString(m.phone) ?? "—"}
                </div>
              </div>
              <Badge color={m.userId ? "indigo" : "clay"}>{m.userId ? "Linked" : "Temp"}</Badge>
            </button>
          ))}
      </div>
    </div>
  );
}

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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          borderRadius: 12,
          background: S.surfaceContainerLow,
          border: `1.5px solid ${S.error}33`,
        }}
      >
        <Avatar name={fullName(drop)} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{fullName(drop)}</div>
          <div style={{ fontSize: 12, color: S.onSurfaceMuted }}>
            Will be removed — data moves into {fullName(keep)}
          </div>
        </div>
        <button
          onClick={onPickAgain}
          style={{
            background: "none",
            border: "none",
            color: S.primary,
            cursor: "pointer",
            fontSize: 13,
            fontFamily: "inherit",
            fontWeight: 500,
          }}
        >
          Change
        </button>
      </div>

      <div
        style={{
          background: S.surfaceContainerLowest,
          border: `1.5px solid ${S.outlineVariant}`,
          borderRadius: 12,
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: S.onSurfaceVariant }}>What will move</div>
        <Row label="Transactions" value={txCount.toString()} />
        <Row label="Pledges" value={pledgeCount.toString()} />
        {fields.length > 0 && (
          <Row
            label="Fields copied to keeper"
            value={fields.join(", ")}
          />
        )}
        {fields.length === 0 && (
          <Row label="Fields copied to keeper" value="None — keeper already has them" muted />
        )}
      </div>
    </div>
  );
}

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: S.onSurfaceVariant }}>{label}</span>
      <span
        style={{
          fontWeight: 500,
          color: muted ? S.onSurfaceMuted : S.onSurface,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

const SkeletonPreview = () => {
  return (
    <div
      style={{
        height: 140,
        borderRadius: 12,
        background: S.surfaceContainer,
      }}
    />
  );
}
