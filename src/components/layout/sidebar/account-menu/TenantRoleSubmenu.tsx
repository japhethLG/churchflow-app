import { Icon, type IconName } from "@/components/primitives/Icon";
import { cn } from "@/lib/utils";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

import { AccountMenuSectionLabel } from "./AccountMenuSectionLabel";
import type { Perspective, TenantSummary } from "../types";

type Role = "admin" | "member";

const ROLE_CONFIG: Record<
  Role,
  { icon: IconName; label: string; dash: "admin" | "member" }
> = {
  admin: { icon: "settings", label: "Admin", dash: "admin" },
  member: { icon: "user", label: "Member", dash: "member" },
};

export const TenantRoleSubmenu = ({
  role,
  tenants,
  perspective,
  tenantSlug,
  onPickTenant,
}: {
  role: Role;
  tenants: TenantSummary[];
  perspective: Perspective;
  tenantSlug?: string;
  onPickTenant: (slug: string, dash: "admin" | "member") => void;
}) => {
  const { icon, label, dash } = ROLE_CONFIG[role];
  const isActivePerspective = perspective === role;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className={cn(
          "rounded-lg px-2.5 py-[9px] text-[13px] data-popup-open:bg-muted",
          isActivePerspective &&
            "!bg-accent font-semibold text-primary data-popup-open:bg-accent",
        )}
      >
        <Icon
          name={icon}
          size={16}
          className={
            isActivePerspective ? "text-primary" : "text-secondary-foreground"
          }
        />
        <span className="flex-1 font-medium text-foreground">{label}</span>
        {isActivePerspective && (
          <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
            Active
          </span>
        )}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent
        className="min-w-[200px] max-w-[240px] rounded-xl p-1.5"
        alignOffset={-4}
        sideOffset={8}
      >
        <AccountMenuSectionLabel>Select church</AccountMenuSectionLabel>
        {tenants.map((m) => {
          const isCurrent =
            isActivePerspective && tenantSlug === m.slug;
          return (
            <DropdownMenuItem
              key={`${role}-${m.slug}`}
              className={cn(
                "cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-[13px]",
                isCurrent && "bg-accent/40 font-semibold text-primary",
              )}
              onClick={() => onPickTenant(m.slug, dash)}
            >
              <span className="min-w-0 flex-1 truncate">{m.name}</span>
              {isCurrent && (
                <Icon
                  name="check"
                  size={14}
                  className="shrink-0 text-primary"
                />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
};
