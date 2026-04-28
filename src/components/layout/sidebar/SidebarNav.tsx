"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/primitives/Icon";
import { cn } from "@/lib/utils";

import type { NavItem } from "./types";

export const SidebarNav = ({ items }: { items: NavItem[] }) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-1 flex-col gap-0.5 overflow-auto">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm no-underline transition-colors hover:bg-muted",
              active
                ? "bg-accent font-semibold text-primary"
                : "font-medium text-secondary-foreground",
            )}
          >
            <Icon
              name={item.icon}
              size={18}
              className={
                active ? "text-primary" : "text-secondary-foreground"
              }
            />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};
