"use client";

import { useState } from "react";
import { Input } from "@/components/primitives/Input";
import { useRenameTenantSlug } from "@/lib/api/tenants";
import { BaseModal } from "../BaseModal";
import type { ModalBaseProps } from "@/lib/modals/registry";

declare module "@/lib/modals/registry" {
  interface ModalPropsMap {
    "rename-tenant-slug": RenameTenantSlugProps;
  }
}

export type RenameTenantSlugProps = {
  tenantId: string;
  currentSlug: string;
};

export const RenameTenantSlugModal = ({
  tenantId,
  currentSlug,
  onClose,
}: RenameTenantSlugProps & ModalBaseProps) => {
  const [slug, setSlug] = useState(currentSlug);
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useRenameTenantSlug();

  const handleRename = async () => {
    if (!slug.trim() || slug === currentSlug) return;
    setError(null);
    try {
      await mutateAsync({ params: { path: { tenantId } }, body: { slug: slug.trim() } });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    }
  };

  return (
    <BaseModal
      overline="URL settings"
      title="Rename slug"
      size="md"
      onClose={onClose}
      dismissible={!isPending}
      primaryAction={{
        label: "Rename",
        onClick: handleRename,
        loading: isPending,
        disabled: !slug.trim() || slug === currentSlug,
        destructive: true,
      }}
      secondaryAction={{ label: "Cancel", onClick: onClose, disabled: isPending }}
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-md bg-warning/10 px-4 py-3 text-[13px] leading-normal text-warning">
          Renaming the slug changes all public URLs for this church. Any existing links using the old slug will stop
          working.
        </div>
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
        />
        {error && <p className="m-0 text-sm text-destructive">{error}</p>}
      </div>
    </BaseModal>
  );
};
