import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as ShadedButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

export type ButtonRole =
	| "primary"
	| "secondary"
	| "tertiary"
	| "success"
	| "warning"
	| "danger"
	| "info";

export type ButtonRecipe =
	| "filled"
	| "gradient"
	| "soft"
	| "tonal"
	| "outline"
	| "ghost";

type ButtonProps = {
	children?: ReactNode;
	/**
	 * Color role. Determines the palette used.
	 * Defaults to "primary".
	 */
	role?: ButtonRole;
	/**
	 * Visual recipe (style).
	 *   "primary"   → gradient
	 *   "secondary" → soft
	 *   "tertiary"  → outline (secondary palette)
	 *   "ghost"     → ghost  (secondary palette)
	 */
	recipe?: ButtonRecipe;
	/**
	 * Legacy shorthand for backward compat.
	 *   "primary"   → role=primary   recipe=gradient
	 *   "secondary" → role=secondary recipe=soft
	 *   "tertiary"  → role=secondary recipe=outline
	 *   "ghost"     → role=secondary recipe=ghost
	 */
	variant?: "primary" | "secondary" | "tertiary" | "ghost";
	size?: "sm" | "md" | "lg";
	icon?: IconName;
	iconRight?: IconName;
	fullWidth?: boolean;
	/** Shorthand for role="danger" recipe="filled". */
	destructive?: boolean;
	loading?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size">;

// Tailwind arbitrary-property classes that set --btn-* CSS vars per role.
// The recipe variants in ui/button.tsx reference these via var(--btn-*).
// Using [--var:value] syntax so Tailwind 4 JIT sees and emits them at build time.
const ROLE_CLASSES: Record<ButtonRole, string> = {
	primary: [
		"[--btn-50:var(--palette-primary-50)]",
		"[--btn-100:var(--palette-primary-100)]",
		"[--btn-200:var(--palette-primary-200)]",
		"[--btn-300:var(--palette-primary-300)]",
		"[--btn-400:var(--palette-primary-400)]",
		"[--btn-500:var(--palette-primary-500)]",
		"[--btn-600:var(--palette-primary-600)]",
		"[--btn-700:var(--palette-primary-700)]",
		"[--btn-800:var(--palette-primary-800)]",
		"[--btn-on:var(--palette-primary-on)]",
		"[--btn-soft-bg:var(--palette-primary-soft-bg)]",
		"[--btn-soft-fg:var(--palette-primary-soft-fg)]",
		"[--btn-softhv-bg:var(--palette-primary-softhv-bg)]",
		"[--btn-softhv-fg:var(--palette-primary-softhv-fg)]",
		"[--btn-tonal-bg:var(--palette-primary-tonal-bg)]",
		"[--btn-tonal-fg:var(--palette-primary-tonal-fg)]",
		"[--btn-tonalhv-bg:var(--palette-primary-tonalhv-bg)]",
		"[--btn-tonalhv-fg:var(--palette-primary-tonalhv-fg)]",
		"[--btn-grad-a:var(--palette-primary-grad-a)]",
		"[--btn-grad-b:var(--palette-primary-grad-b)]",
	].join(" "),

	secondary: [
		"[--btn-50:var(--palette-secondary-50)]",
		"[--btn-100:var(--palette-secondary-100)]",
		"[--btn-200:var(--palette-secondary-200)]",
		"[--btn-300:var(--palette-secondary-300)]",
		"[--btn-400:var(--palette-secondary-400)]",
		"[--btn-500:var(--palette-secondary-500)]",
		"[--btn-600:var(--palette-secondary-600)]",
		"[--btn-700:var(--palette-secondary-700)]",
		"[--btn-800:var(--palette-secondary-800)]",
		"[--btn-on:var(--palette-secondary-on)]",
		"[--btn-soft-bg:var(--palette-secondary-soft-bg)]",
		"[--btn-soft-fg:var(--palette-secondary-soft-fg)]",
		"[--btn-softhv-bg:var(--palette-secondary-softhv-bg)]",
		"[--btn-softhv-fg:var(--palette-secondary-softhv-fg)]",
		"[--btn-tonal-bg:var(--palette-secondary-tonal-bg)]",
		"[--btn-tonal-fg:var(--palette-secondary-tonal-fg)]",
		"[--btn-tonalhv-bg:var(--palette-secondary-tonalhv-bg)]",
		"[--btn-tonalhv-fg:var(--palette-secondary-tonalhv-fg)]",
		"[--btn-grad-a:var(--palette-secondary-grad-a)]",
		"[--btn-grad-b:var(--palette-secondary-grad-b)]",
	].join(" "),

	tertiary: [
		"[--btn-50:var(--palette-tertiary-50)]",
		"[--btn-100:var(--palette-tertiary-100)]",
		"[--btn-200:var(--palette-tertiary-200)]",
		"[--btn-300:var(--palette-tertiary-300)]",
		"[--btn-400:var(--palette-tertiary-400)]",
		"[--btn-500:var(--palette-tertiary-500)]",
		"[--btn-600:var(--palette-tertiary-600)]",
		"[--btn-700:var(--palette-tertiary-700)]",
		"[--btn-800:var(--palette-tertiary-800)]",
		"[--btn-on:var(--palette-tertiary-on)]",
		"[--btn-soft-bg:var(--palette-tertiary-soft-bg)]",
		"[--btn-soft-fg:var(--palette-tertiary-soft-fg)]",
		"[--btn-softhv-bg:var(--palette-tertiary-softhv-bg)]",
		"[--btn-softhv-fg:var(--palette-tertiary-softhv-fg)]",
		"[--btn-tonal-bg:var(--palette-tertiary-tonal-bg)]",
		"[--btn-tonal-fg:var(--palette-tertiary-tonal-fg)]",
		"[--btn-tonalhv-bg:var(--palette-tertiary-tonalhv-bg)]",
		"[--btn-tonalhv-fg:var(--palette-tertiary-tonalhv-fg)]",
		"[--btn-grad-a:var(--palette-tertiary-grad-a)]",
		"[--btn-grad-b:var(--palette-tertiary-grad-b)]",
	].join(" "),

	success: [
		"[--btn-50:var(--palette-success-50)]",
		"[--btn-100:var(--palette-success-100)]",
		"[--btn-200:var(--palette-success-200)]",
		"[--btn-300:var(--palette-success-300)]",
		"[--btn-400:var(--palette-success-400)]",
		"[--btn-500:var(--palette-success-500)]",
		"[--btn-600:var(--palette-success-600)]",
		"[--btn-700:var(--palette-success-700)]",
		"[--btn-800:var(--palette-success-800)]",
		"[--btn-on:var(--palette-success-on)]",
		"[--btn-soft-bg:var(--palette-success-soft-bg)]",
		"[--btn-soft-fg:var(--palette-success-soft-fg)]",
		"[--btn-softhv-bg:var(--palette-success-softhv-bg)]",
		"[--btn-softhv-fg:var(--palette-success-softhv-fg)]",
		"[--btn-tonal-bg:var(--palette-success-tonal-bg)]",
		"[--btn-tonal-fg:var(--palette-success-tonal-fg)]",
		"[--btn-tonalhv-bg:var(--palette-success-tonalhv-bg)]",
		"[--btn-tonalhv-fg:var(--palette-success-tonalhv-fg)]",
		"[--btn-grad-a:var(--palette-success-grad-a)]",
		"[--btn-grad-b:var(--palette-success-grad-b)]",
	].join(" "),

	warning: [
		"[--btn-50:var(--palette-warning-50)]",
		"[--btn-100:var(--palette-warning-100)]",
		"[--btn-200:var(--palette-warning-200)]",
		"[--btn-300:var(--palette-warning-300)]",
		"[--btn-400:var(--palette-warning-400)]",
		"[--btn-500:var(--palette-warning-500)]",
		"[--btn-600:var(--palette-warning-600)]",
		"[--btn-700:var(--palette-warning-700)]",
		"[--btn-800:var(--palette-warning-800)]",
		"[--btn-on:var(--palette-warning-on)]",
		"[--btn-soft-bg:var(--palette-warning-soft-bg)]",
		"[--btn-soft-fg:var(--palette-warning-soft-fg)]",
		"[--btn-softhv-bg:var(--palette-warning-softhv-bg)]",
		"[--btn-softhv-fg:var(--palette-warning-softhv-fg)]",
		"[--btn-tonal-bg:var(--palette-warning-tonal-bg)]",
		"[--btn-tonal-fg:var(--palette-warning-tonal-fg)]",
		"[--btn-tonalhv-bg:var(--palette-warning-tonalhv-bg)]",
		"[--btn-tonalhv-fg:var(--palette-warning-tonalhv-fg)]",
		"[--btn-grad-a:var(--palette-warning-grad-a)]",
		"[--btn-grad-b:var(--palette-warning-grad-b)]",
	].join(" "),

	danger: [
		"[--btn-50:var(--palette-danger-50)]",
		"[--btn-100:var(--palette-danger-100)]",
		"[--btn-200:var(--palette-danger-200)]",
		"[--btn-300:var(--palette-danger-300)]",
		"[--btn-400:var(--palette-danger-400)]",
		"[--btn-500:var(--palette-danger-500)]",
		"[--btn-600:var(--palette-danger-600)]",
		"[--btn-700:var(--palette-danger-700)]",
		"[--btn-800:var(--palette-danger-800)]",
		"[--btn-on:var(--palette-danger-on)]",
		"[--btn-soft-bg:var(--palette-danger-soft-bg)]",
		"[--btn-soft-fg:var(--palette-danger-soft-fg)]",
		"[--btn-softhv-bg:var(--palette-danger-softhv-bg)]",
		"[--btn-softhv-fg:var(--palette-danger-softhv-fg)]",
		"[--btn-tonal-bg:var(--palette-danger-tonal-bg)]",
		"[--btn-tonal-fg:var(--palette-danger-tonal-fg)]",
		"[--btn-tonalhv-bg:var(--palette-danger-tonalhv-bg)]",
		"[--btn-tonalhv-fg:var(--palette-danger-tonalhv-fg)]",
		"[--btn-grad-a:var(--palette-danger-grad-a)]",
		"[--btn-grad-b:var(--palette-danger-grad-b)]",
	].join(" "),

	info: [
		"[--btn-50:var(--palette-info-50)]",
		"[--btn-100:var(--palette-info-100)]",
		"[--btn-200:var(--palette-info-200)]",
		"[--btn-300:var(--palette-info-300)]",
		"[--btn-400:var(--palette-info-400)]",
		"[--btn-500:var(--palette-info-500)]",
		"[--btn-600:var(--palette-info-600)]",
		"[--btn-700:var(--palette-info-700)]",
		"[--btn-800:var(--palette-info-800)]",
		"[--btn-on:var(--palette-info-on)]",
		"[--btn-soft-bg:var(--palette-info-soft-bg)]",
		"[--btn-soft-fg:var(--palette-info-soft-fg)]",
		"[--btn-softhv-bg:var(--palette-info-softhv-bg)]",
		"[--btn-softhv-fg:var(--palette-info-softhv-fg)]",
		"[--btn-tonal-bg:var(--palette-info-tonal-bg)]",
		"[--btn-tonal-fg:var(--palette-info-tonal-fg)]",
		"[--btn-tonalhv-bg:var(--palette-info-tonalhv-bg)]",
		"[--btn-tonalhv-fg:var(--palette-info-tonalhv-fg)]",
		"[--btn-grad-a:var(--palette-info-grad-a)]",
		"[--btn-grad-b:var(--palette-info-grad-b)]",
	].join(" "),
};

// Roles that support gradient (secondary is solid only).
const GRADIENT_CAPABLE = new Set<ButtonRole>([
	"primary",
	"tertiary",
	"success",
	"warning",
	"danger",
	"info",
]);

// Legacy variant → [role, recipe] for backward compat.
const VARIANT_MAP: Record<
	NonNullable<ButtonProps["variant"]>,
	[ButtonRole, ButtonRecipe]
> = {
	primary: ["primary", "gradient"],
	secondary: ["secondary", "soft"],
	tertiary: ["secondary", "outline"],
	ghost: ["secondary", "ghost"],
};

const RECIPE_VARIANT: Record<
	ButtonRecipe,
	| "role-filled"
	| "role-gradient"
	| "role-soft"
	| "role-tonal"
	| "role-outline"
	| "role-ghost"
> = {
	filled: "role-filled",
	gradient: "role-gradient",
	soft: "role-soft",
	tonal: "role-tonal",
	outline: "role-outline",
	ghost: "role-ghost",
};

const SIZE_MAP = { sm: "sm", md: "default", lg: "lg" } as const;

export const Button = ({
	children,
	variant,
	role: roleProp,
	recipe: recipeProp,
	size = "md",
	icon,
	iconRight,
	fullWidth,
	disabled,
	destructive,
	loading,
	className,
	...rest
}: ButtonProps) => {
	let effectiveRole: ButtonRole;
	let effectiveRecipe: ButtonRecipe;

	if (destructive) {
		effectiveRole = roleProp ?? "danger";
		effectiveRecipe = recipeProp ?? "filled";
	} else if (roleProp || recipeProp) {
		effectiveRole = roleProp ?? "primary";
		effectiveRecipe = recipeProp ?? "gradient";
	} else {
		const [mappedRole, mappedRecipe] = VARIANT_MAP[variant ?? "primary"];
		effectiveRole = mappedRole;
		effectiveRecipe = mappedRecipe;
	}

	if (effectiveRecipe === "gradient" && !GRADIENT_CAPABLE.has(effectiveRole)) {
		effectiveRecipe = "filled";
	}

	const iconSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

	return (
		<ShadedButton
			variant={RECIPE_VARIANT[effectiveRecipe]}
			size={SIZE_MAP[size]}
			disabled={disabled || loading}
			className={cn(
				ROLE_CLASSES[effectiveRole],
				fullWidth && "w-full",
				className,
			)}
			{...rest}
		>
			{loading && <Loader2 className="animate-spin" />}
			{!loading && icon && <Icon name={icon} size={iconSize} />}
			<span className={cn(loading && "opacity-70")}>{children}</span>
			{!loading && iconRight && <Icon name={iconRight} size={iconSize} />}
		</ShadedButton>
	);
};
