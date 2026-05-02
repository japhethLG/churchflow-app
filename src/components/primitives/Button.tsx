import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as ShadedButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

type ButtonProps = {
	children?: ReactNode;
	variant?: "primary" | "secondary" | "tertiary" | "ghost";
	size?: "sm" | "md" | "lg";
	icon?: IconName;
	iconRight?: IconName;
	fullWidth?: boolean;
	destructive?: boolean;
	loading?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "size">;

export const Button = ({
	children,
	variant = "primary",
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
	const isCurrentlyDisabled = disabled || loading;

	const variantMap: Record<
		string,
		| "default"
		| "destructive"
		| "secondary"
		| "ghost"
		| "link"
		| "outline"
		| null
		| undefined
	> = {
		primary: destructive ? "destructive" : "default",
		secondary: "secondary",
		tertiary: "ghost",
		ghost: "ghost",
	};

	const sizeMap: Record<
		string,
		| "default"
		| "sm"
		| "lg"
		| "icon"
		| "xs"
		| "icon-xs"
		| "icon-sm"
		| "icon-lg"
		| null
		| undefined
	> = {
		sm: "sm",
		md: "default",
		lg: "lg",
	};

	return (
		<ShadedButton
			variant={variantMap[variant]}
			size={sizeMap[size]}
			disabled={isCurrentlyDisabled}
			className={cn(
				"rounded-full font-medium transition-all duration-200 active:scale-[0.98]",
				fullWidth && "w-full",
				variant === "primary" &&
					!destructive && [
						"bg-linear-to-br from-ring to-primary",
						"hover:shadow-[0_12px_20px_-8px_rgba(53,37,205,0.3)] hover:-translate-y-0.5 hover:scale-[1.01]",
						"active:translate-y-0 active:scale-[0.98] active:shadow-sm",
					],
				variant === "secondary" &&
					"hover:bg-secondary/70 hover:-translate-y-0.5 active:translate-y-0",
				(variant === "ghost" || variant === "tertiary") &&
					"hover:bg-muted/80 hover:text-foreground",
				className,
			)}
			{...rest}
		>
			{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
			{!loading && icon && (
				<Icon name={icon} size={size === "sm" ? 14 : 16} className="mr-2" />
			)}
			<span className={cn(loading && "opacity-70")}>{children}</span>
			{!loading && iconRight && (
				<Icon
					name={iconRight}
					size={size === "sm" ? 14 : 16}
					className="ml-2"
				/>
			)}
		</ShadedButton>
	);
};
