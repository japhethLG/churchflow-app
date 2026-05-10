"use client";

import type { ToasterProps } from "sonner";
import { toast } from "sonner";
import { Icon } from "@/components/primitives/Icon";
import { Toaster as BaseToaster } from "@/components/ui/sonner";

export const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<BaseToaster
			theme="light"
			icons={{
				success: <Icon name="circleCheck" className="size-4" />,
				info: <Icon name="info" className="size-4" />,
				warning: <Icon name="triangleAlert" className="size-4" />,
				error: <Icon name="octagonX" className="size-4" />,
				loading: <Icon name="loader" className="size-4 animate-spin" />,
			}}
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--border-radius": "var(--radius)",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { toast };
