# ChurchFlow → shadcn/ui Refactoring Plan

## Current State Summary

| Area | Current | Target |
|---|---|---|
| Styling | Inline `style={{}}` objects using `SANCTUARY` tokens | Tailwind utility classes + CSS variables |
| Primitives | Hand-rolled in `src/components/primitives/` (16 files) | shadcn/ui components in `src/components/ui/` |
| Design tokens | `src/lib/design/tokens.ts` (JS object) + partial CSS vars in `globals.css` | CSS variables in `globals.css` → `@theme inline` → Tailwind utilities |
| Page files | `src/app/**/page.tsx` mixes routing, data-fetching, and UI layout | Thin route shells delegating to `src/components/pages/` |
| Inline style count | ~27 files in `src/app/`, ~80 files in `src/components/` | 0 inline styles |

---

## Phase 0 — Foundation: shadcn Init + Design Tokens → Tailwind

### 0.1 Initialize shadcn

```bash
npx shadcn@latest init
```

This creates `components.json` and `src/components/ui/`. Accept defaults: TypeScript, `@/components/ui`, CSS variables = true, Tailwind v4.

### 0.2 Install required dependencies

```bash
npm install tw-animate-css class-variance-authority clsx tailwind-merge lucide-react
```

Create the `cn()` utility:

```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

### 0.3 Rewrite `globals.css` — Map Sanctuary tokens to CSS variables

Replace the current `globals.css` with the shadcn convention. Map the existing Sanctuary palette into the shadcn variable slots, and add custom extended variables for domain-specific colors.

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* ── shadcn core tokens ── */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* ── Sidebar ── */
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* ── Radii ── */
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);

  /* ── Charts ── */
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* ── Sanctuary extended tokens ── */
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-info: var(--info);
  --color-info-foreground: var(--info-foreground);

  /* Transaction type tokens */
  --color-tx-tithe: var(--tx-tithe);
  --color-tx-offering: var(--tx-offering);
  --color-tx-mission: var(--tx-mission);
  --color-tx-first-fruit: var(--tx-first-fruit);
  --color-tx-commitment: var(--tx-commitment);
  --color-tx-donation: var(--tx-donation);
  --color-tx-other: var(--tx-other);
}

:root {
  --radius: 0.75rem;

  /* Map Sanctuary → shadcn core slots */
  --background: #F7F9FB;       /* surface */
  --foreground: #191C1E;       /* onSurface */
  --card: #FFFFFF;             /* surfaceContainerLowest */
  --card-foreground: #191C1E;
  --popover: #FFFFFF;
  --popover-foreground: #191C1E;
  --primary: #3525CD;
  --primary-foreground: #FFFFFF;
  --secondary: #ECEEF0;        /* surfaceContainer */
  --secondary-foreground: #191C1E;
  --muted: #F1F3F6;            /* surfaceContainerLow */
  --muted-foreground: #6B7280; /* onSurfaceMuted */
  --accent: #E6E6FA;           /* primaryFixed */
  --accent-foreground: #3525CD;
  --destructive: #8C1D18;
  --destructive-foreground: #FFFFFF;
  --border: #C2C7CE;           /* outlineVariant */
  --input: #E4E7EB;            /* surfaceContainerHigh */
  --ring: #4F46E5;             /* primaryContainer */

  /* Sidebar */
  --sidebar: #FFFFFF;
  --sidebar-foreground: #191C1E;
  --sidebar-primary: #3525CD;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #E6E6FA;
  --sidebar-accent-foreground: #3525CD;
  --sidebar-border: #C2C7CE22;
  --sidebar-ring: #4F46E5;

  /* Charts */
  --chart-1: #4F46E5;
  --chart-2: #16A34A;
  --chart-3: #2563EB;
  --chart-4: #D97706;
  --chart-5: #9333EA;

  /* Semantic */
  --success: #156B3D;
  --success-foreground: #C8EFD4;
  --warning: #8B5A00;
  --warning-foreground: #FDE8B8;
  --info: #1B4C8C;
  --info-foreground: #D6E6FB;

  /* Tertiary / clay */
  --tertiary: #7E3000;
  --tertiary-container: #FBE9DD;

  /* Transaction types */
  --tx-tithe: #4F46E5;
  --tx-offering: #16A34A;
  --tx-mission: #2563EB;
  --tx-first-fruit: #D97706;
  --tx-commitment: #9333EA;
  --tx-donation: #0D9488;
  --tx-other: #6B7280;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground font-[var(--font-inter),system-ui,sans-serif];
  }
}
```

### 0.4 Delete `src/lib/design/tokens.ts`

After all references are migrated. During migration, the file stays so you can cross-reference values.

---

## Phase 1 — Install shadcn Primitives

Install the shadcn components that replace your hand-rolled ones:

```bash
npx shadcn@latest add button card badge input dialog dropdown-menu \
  table avatar separator skeleton tooltip select label tabs
```

### Mapping Table: Current Primitive → shadcn Replacement

| Current (`primitives/`) | shadcn (`ui/`) | Notes |
|---|---|---|
| `Button` | `button` | Use `variant` + `size` props from CVA |
| `Card` | `card` | `Card`, `CardHeader`, `CardContent`, `CardFooter` |
| `Badge` | `badge` | Extend variants for domain colors (indigo, green, amber, etc.) |
| `Input` | `input` + `label` | Compose with `Label` for labeled inputs |
| `BaseModal` | `dialog` | `Dialog`, `DialogContent`, `DialogHeader`, `DialogFooter` |
| `RowActionsMenu` | `dropdown-menu` | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuItem` |
| `DataTable` / `Table` | `table` | `Table`, `TableHeader`, `TableRow`, `TableCell` |
| `Avatar` | `avatar` | `Avatar`, `AvatarFallback`, `AvatarImage` |
| `StatCard` | `card` (composed) | Custom composition of `Card` + domain logic |
| `PageHeader` | Keep as custom | Wrap with Tailwind classes instead of inline styles |
| `Chip` | `toggle` or custom | Use shadcn `Toggle` or keep as custom with Tailwind |
| `Icon` | `lucide-react` | Replace custom icon wrapper with direct lucide imports |
| `Charts` | Keep (recharts) | Just migrate inline styles to Tailwind |

### Pattern for extending shadcn variants

When a shadcn component needs domain-specific variants (e.g. Badge colors), extend the CVA config in the installed component file:

```tsx
// src/components/ui/badge.tsx — extend variants
const badgeVariants = cva("...", {
  variants: {
    variant: {
      default: "...",
      secondary: "...",
      destructive: "...",
      outline: "...",
      // Domain extensions:
      indigo: "bg-indigo-100 text-indigo-800",
      green: "bg-emerald-100 text-emerald-800",
      amber: "bg-amber-100 text-amber-900",
      // ...etc
    },
  },
});
```

---

## Phase 2 — Refactor `src/app/` Pages (Pattern)

### The Rule

> **`src/app/**/page.tsx`** files must contain ONLY:
> 1. Route params extraction
> 2. Server-side data fetching / auth guards (for server components)
> 3. A single import + render of the corresponding page component from `src/components/pages/`

### Pattern A — Client page (most current pages)

**Before** (monolithic — like `settings/page.tsx` at 504 lines):
```tsx
"use client";
import { useState, useEffect } from "react";
import { SANCTUARY as S } from "@/lib/design/tokens";
// ... 500 lines of UI, state, inline styles
```

**After** (thin shell):
```tsx
"use client";
import { useParams } from "next/navigation";
import { SettingsPage } from "@/components/pages/settings";

export default () => {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  return <SettingsPage tenantSlug={tenantSlug} />;
};
```

All UI logic, hooks, state, and rendering moves to `src/components/pages/settings/SettingsPage.tsx`.

### Pattern B — Server page with auth (like current admin layout)

The layout files that do auth checks are fine as-is — they already follow the thin-shell pattern. No changes needed for layout files.

### Pattern C — Pages already partially migrated

Pages like `dashboard/page.tsx` and `transactions/page.tsx` already import from `src/components/pages/` but still contain data-fetching hooks, state management, and some inline styles. These need the data logic extracted into the page component.

### Checklist for each page migration

1. Create `src/components/pages/{domain}/{DomainPage}.tsx` if it doesn't exist
2. Move ALL state, hooks, handlers, and JSX from `page.tsx` → page component
3. `page.tsx` becomes ≤15 lines: params + single component render
4. Replace all `style={{}}` with Tailwind classes
5. Replace all `SANCTUARY` token references with Tailwind color utilities (`text-primary`, `bg-card`, `text-muted-foreground`, etc.)
6. Replace hand-rolled primitives with shadcn equivalents
7. Export page component barrel from `src/components/pages/{domain}/index.ts`

---

## Phase 3 — Component Decomposition Pattern

### Single Responsibility Breakdown

Large page components should be broken down following this pattern:

```
src/components/pages/settings/
├── index.ts              # barrel export
├── SettingsPage.tsx       # orchestrator: hooks + composed sections
├── ChurchProfileCard.tsx  # section component
├── FinancialCard.tsx      # section component
├── TimezoneCard.tsx       # section component
├── IdentifiersCard.tsx    # section component
└── use-settings-form.ts   # custom hook for form state
```

### Rules for decomposition

1. **One concern per component** — a card, a filter bar, a table section
2. **Extract hooks** when a component manages complex state (forms, filters, pagination). Name them `use-{domain}-{concern}.ts`
3. **Props over context** for page-level data. Only use context for app-wide concerns (auth, theme)
4. **Collocate** — keep domain components inside their `pages/{domain}/` folder
5. **Barrel export** — every domain folder gets an `index.ts`

### Hook extraction pattern

```tsx
// src/components/pages/settings/use-settings-form.ts
export const useSettingsForm = (tenantSlug: string) => {
  const tenantQ = useTenant(tenantSlug);
  const updateTenant = useUpdateTenant();
  const [form, setForm] = useState({...});
  const [dirty, setDirty] = useState(false);

  useEffect(() => { /* populate from tenant */ }, [tenantQ.data]);

  const save = async () => { /* mutation logic */ };

  return { form, setField, dirty, save, saving: updateTenant.isPending, tenant: tenantQ };
};
```

---

## Phase 4 — Inline Style → Tailwind Migration Pattern

### Mapping cheat-sheet

| Inline style | Tailwind equivalent |
|---|---|
| `style={{ display: "flex", gap: 16 }}` | `className="flex gap-4"` |
| `style={{ fontSize: 13, fontWeight: 500 }}` | `className="text-sm font-medium"` |
| `style={{ color: S.onSurfaceMuted }}` | `className="text-muted-foreground"` |
| `style={{ background: S.surfaceContainerLowest }}` | `className="bg-card"` |
| `style={{ borderRadius: 16 }}` | `className="rounded-2xl"` |
| `style={{ padding: "12px 24px" }}` | `className="px-6 py-3"` |
| `style={{ letterSpacing: "-0.025em" }}` | `className="tracking-tight"` |
| `style={{ overflow: "hidden", textOverflow: "ellipsis" }}` | `className="truncate"` |
| `style={{ gridTemplateColumns: "1fr 1fr" }}` | `className="grid grid-cols-2"` |

### Token → Tailwind class mapping

| SANCTUARY token | CSS variable | Tailwind class |
|---|---|---|
| `S.primary` | `--primary` | `text-primary`, `bg-primary` |
| `S.primaryContainer` | `--ring` | `text-ring`, `bg-ring` |
| `S.primaryFixed` | `--accent` | `text-accent`, `bg-accent` |
| `S.onPrimary` | `--primary-foreground` | `text-primary-foreground` |
| `S.surface` | `--background` | `bg-background` |
| `S.surfaceContainerLowest` | `--card` | `bg-card` |
| `S.surfaceContainerLow` | `--muted` | `bg-muted` |
| `S.surfaceContainer` | `--secondary` | `bg-secondary` |
| `S.surfaceContainerHigh` | `--input` | `bg-input` |
| `S.onSurface` | `--foreground` | `text-foreground` |
| `S.onSurfaceVariant` | `--secondary-foreground` | `text-secondary-foreground` |
| `S.onSurfaceMuted` | `--muted-foreground` | `text-muted-foreground` |
| `S.outline` | — | `text-muted-foreground` |
| `S.outlineVariant` | `--border` | `border-border` |
| `S.error` | `--destructive` | `text-destructive` |
| `S.errorContainer` | `--destructive/10` | `bg-destructive/10` |
| `S.success` | `--success` | `text-success` |
| `S.warning` | `--warning` | `text-warning` |

### Handling hover states

Replace `onMouseEnter`/`onMouseLeave` inline handlers with Tailwind hover utilities:

```tsx
// BEFORE
onMouseEnter={(e) => e.currentTarget.style.background = S.surfaceContainerLow}
onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}

// AFTER
className="hover:bg-muted transition-colors"
```

### Handling dynamic/conditional styles

Use `cn()` for conditional classes:

```tsx
<div className={cn(
  "rounded-full px-3.5 py-1.5 text-xs font-medium",
  active ? "bg-foreground text-card" : "bg-card text-muted-foreground"
)} />
```

---

## Phase 5 — Modal System Migration

### Replace `BaseModal` with shadcn `Dialog`

```tsx
// BEFORE: BaseModal with inline styles
<BaseModal title="Edit Member" onClose={onClose} primaryAction={...}>
  {children}
</BaseModal>

// AFTER: shadcn Dialog
<Dialog open onOpenChange={(open) => !open && onClose()}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Member</DialogTitle>
      <DialogDescription>Update member details.</DialogDescription>
    </DialogHeader>
    {children}
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

The modal store (`lib/modals/store.ts`) and host (`lib/modals/host.tsx`) pattern is fine — keep the Zustand store + registry. Just swap `BaseModal` for `Dialog` inside each modal component.

---

## Phase 6 — Layout Components

### Sidebar → shadcn Sidebar

Consider using shadcn's `sidebar` component. Install with:
```bash
npx shadcn@latest add sidebar
```

This gives you `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarMenuItem`, etc. with proper accessibility and responsive behavior built-in.

If the current Sidebar's flyout/context-switching is too custom, keep the structure but migrate all inline styles to Tailwind classes.

### AppShell

Migrate from inline styles to Tailwind:

```tsx
// AFTER
<div className="flex min-h-screen bg-background font-sans text-foreground">
  <Sidebar ... />
  <div className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
    <TopBar ... />
    <div className="flex-1 overflow-auto px-8 pb-8">
      {children}
    </div>
  </div>
</div>
```

---

## Phase 7 — Icon Migration

Replace the custom `Icon` component wrapping inline SVGs with `lucide-react`:

```tsx
// BEFORE
import { Icon } from "@/components/primitives";
<Icon name="plus" size={16} />

// AFTER
import { Plus } from "lucide-react";
<Plus className="size-4" />
```

Create a mapping file if needed for gradual migration:
```ts
// src/lib/icons.ts
export { Plus, Users, Calendar, Receipt, Home, Settings,
  Mail, User, ChevronDown, ChevronRight, MoreHorizontal,
  Download, Search, Check, LogOut, BarChart3 } from "lucide-react";
```

---

## Execution Order

| Step | Scope | Depends on |
|---|---|---|
| 0.1 | `shadcn init` | — |
| 0.2 | Install deps + `cn()` utility | 0.1 |
| 0.3 | Rewrite `globals.css` | 0.2 |
| 1 | Install shadcn components | 0.3 |
| 2 | Migrate primitives one-by-one | 1 |
| 3 | Migrate layout (AppShell, Sidebar, TopBar) | 2 |
| 4 | Migrate modals (BaseModal → Dialog) | 2 |
| 5 | Refactor `src/app/` pages (thin shells) | 2 |
| 6 | Migrate page components (inline styles → TW) | 2, 5 |
| 7 | Delete `tokens.ts`, clean up unused imports | ✅ Done |

### Per-component migration checklist

- [x] Remove `import { SANCTUARY } from "@/lib/design/tokens"` (file deleted; no imports remain)
- [ ] Remove all `style={{}}` props
- [ ] Replace with Tailwind utility classes using `cn()`
- [ ] Replace hand-rolled primitives with shadcn `ui/` imports
- [ ] Replace `<Icon name="x" />` with lucide-react component
- [ ] Replace `onMouseEnter`/`onMouseLeave` with `hover:` utilities
- [ ] Replace inline `<style>` tags (keyframes) with Tailwind animations or CSS in globals
- [ ] Verify no `CSSProperties` imports remain
- [ ] Run `npm run typecheck` — no errors
- [ ] Visual check — UI matches before/after

---

## Files to delete after full migration

- ~~`src/lib/design/tokens.ts`~~ (removed)
- `src/lib/design/logo-gradient.ts` (if only used for inline styles)
- `src/components/primitives/` (entire directory — replaced by `src/components/ui/`)

## Files to keep / adapt

- `src/components/primitives/Amount.tsx` → move to `src/components/ui/amount.tsx` with Tailwind
- `src/components/primitives/Charts.tsx` → move to `src/components/ui/charts.tsx` with Tailwind
- `src/components/primitives/Wordmark.tsx` → move to `src/components/ui/wordmark.tsx`
- `src/components/pages/**` → keep structure, migrate styles in-place

---

## Key Rules for the Executing AI

1. **Never use `style={{}}`.** Every visual property must be a Tailwind class.
2. **Never import `SANCTUARY`** or `tokens.ts`. Use Tailwind color utilities mapped to CSS variables.
3. **`src/app/**/page.tsx` must be ≤20 lines.** Extract everything else to `src/components/pages/`.
4. **Use `cn()` from `@/lib/utils`** for all conditional classNames.
5. **Use shadcn components** (`@/components/ui/*`) as the base for all UI primitives.
6. **Extend shadcn variants** (via CVA) for domain-specific needs rather than creating parallel components.
7. **Extract custom hooks** when a component manages >3 pieces of state.
8. **Barrel export** every domain folder in `src/components/pages/{domain}/index.ts`.
9. **One concern per file.** If a component exceeds ~150 lines, break it into sub-components.
10. **Preserve existing behavior.** This is a styling/structure refactor, not a feature change.
