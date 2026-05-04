import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"group/button inline-flex shrink-0 items-center justify-center rounded-[10px] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-[120ms] ease-out outline-none select-none focus-visible:ring-3 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				/* ── legacy shadcn variants (used by non-button primitives) ── */
				default:
					"bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/50",
				outline:
					"border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 focus-visible:ring-ring/50",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground focus-visible:ring-ring/50",
				ghost:
					"hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 focus-visible:ring-ring/50",
				destructive:
					"bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
				link: "text-primary underline-offset-4 hover:underline focus-visible:ring-ring/50",

				/* ── palette-driven recipe variants (use --btn-* CSS vars) ── */
				"role-filled": [
					"bg-[var(--btn-600)] text-[var(--btn-on)]",
					"shadow-[0_1px_0_var(--btn-700)]",
					"hover:bg-[var(--btn-700)] hover:shadow-[0_2px_8px_color-mix(in_srgb,var(--btn-800)_20%,transparent)]",
					"active:not-aria-[haspopup]:bg-[var(--btn-800)] active:not-aria-[haspopup]:shadow-none",
					"focus-visible:ring-[var(--btn-200)]",
					"disabled:!opacity-100 disabled:bg-[#E4E7EB] disabled:text-[#9AA1A9] disabled:shadow-none",
				].join(" "),

				"role-gradient": [
					"text-[var(--btn-on)]",
					"bg-[linear-gradient(135deg,var(--btn-grad-a),var(--btn-grad-b))]",
					"[box-shadow:0_6px_16px_-4px_color-mix(in_srgb,var(--btn-grad-b)_33%,transparent)]",
					"hover:[box-shadow:0_10px_24px_-4px_color-mix(in_srgb,var(--btn-grad-b)_50%,transparent)]",
					"active:not-aria-[haspopup]:[box-shadow:0_2px_6px_-2px_color-mix(in_srgb,var(--btn-grad-b)_33%,transparent)]",
					"focus-visible:ring-[var(--btn-200)] focus-visible:[box-shadow:0_0_0_3px_var(--btn-200),0_6px_16px_-4px_color-mix(in_srgb,var(--btn-grad-b)_33%,transparent)]",
					"disabled:!opacity-100 disabled:bg-[#E4E7EB] disabled:bg-none disabled:text-[#9AA1A9] disabled:[box-shadow:none]",
				].join(" "),

				"role-soft": [
					"bg-[var(--btn-soft-bg)] text-[var(--btn-soft-fg)]",
					"hover:bg-[var(--btn-softhv-bg)] hover:text-[var(--btn-softhv-fg)]",
					"active:not-aria-[haspopup]:bg-[var(--btn-tonal-bg)] active:not-aria-[haspopup]:text-[var(--btn-tonal-fg)]",
					"focus-visible:ring-[var(--btn-200)]",
					"disabled:!opacity-100 disabled:bg-[#F1F3F6] disabled:text-[#9AA1A9]",
				].join(" "),

				"role-tonal": [
					"bg-[var(--btn-tonal-bg)] text-[var(--btn-tonal-fg)]",
					"hover:bg-[var(--btn-tonalhv-bg)] hover:text-[var(--btn-tonalhv-fg)]",
					"active:not-aria-[haspopup]:bg-[var(--btn-200)] active:not-aria-[haspopup]:text-[var(--btn-tonal-fg)]",
					"focus-visible:ring-[var(--btn-200)]",
					"disabled:!opacity-100 disabled:bg-[#F1F3F6] disabled:text-[#9AA1A9]",
				].join(" "),

				"role-outline": [
					"bg-transparent text-[var(--btn-700)]",
					"shadow-[inset_0_0_0_1px_var(--btn-300)]",
					"hover:bg-[var(--btn-50)] hover:text-[var(--btn-800)] hover:shadow-[inset_0_0_0_1px_var(--btn-400)]",
					"active:not-aria-[haspopup]:bg-[var(--btn-100)] active:not-aria-[haspopup]:shadow-[inset_0_0_0_1px_var(--btn-500)]",
					"focus-visible:ring-[var(--btn-200)] focus-visible:shadow-[inset_0_0_0_1px_var(--btn-400)]",
					"disabled:!opacity-100 disabled:bg-transparent disabled:text-[#9AA1A9] disabled:shadow-[inset_0_0_0_1px_#C2C7CE]",
				].join(" "),

				"role-ghost": [
					"bg-transparent text-[var(--btn-700)]",
					"hover:bg-[var(--btn-50)] hover:text-[var(--btn-800)]",
					"active:not-aria-[haspopup]:bg-[var(--btn-100)] active:not-aria-[haspopup]:text-[var(--btn-800)]",
					"focus-visible:ring-[var(--btn-200)]",
					"disabled:!opacity-100 disabled:bg-transparent disabled:text-[#9AA1A9]",
				].join(" "),
			},
			size: {
				default: "h-10 gap-1.5 px-5",
				xs: "h-6 gap-1 rounded-[8px] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
				sm: "h-8 gap-1 rounded-[8px] px-3.5 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
				lg: "h-[52px] gap-2 px-7 text-[15px]",
				icon: "size-8",
				"icon-xs": "size-6 rounded-[8px] [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-8 rounded-[8px]",
				"icon-lg": "size-[52px] rounded-[12px]",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

export type ButtonProps = ButtonPrimitive.Props &
	Omit<
		React.ComponentPropsWithRef<"button">,
		"className" | keyof ButtonPrimitive.Props | "variant" | "size"
	> &
	ButtonVariants;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant = "default", size = "default", ...props }, ref) => {
		return (
			<ButtonPrimitive
				ref={ref}
				data-slot="button"
				className={cn(buttonVariants({ variant, size, className }))}
				{...props}
			/>
		);
	},
);

Button.displayName = "Button";

export { buttonVariants };
