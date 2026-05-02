import type { ReactNode } from "react";
import { Card as ShadedCard } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Card = ({
	children,
	padding = 24,
	className,
}: {
	children: ReactNode;
	padding?: 0 | 8 | 12 | 16 | 20 | 24 | 28 | 32 | 40 | 48;
	className?: string;
}) => {
	const paddingClasses = {
		0: "p-0",
		8: "p-2",
		12: "p-3",
		16: "p-4",
		20: "p-5",
		24: "p-6",
		28: "p-7",
		32: "p-8",
		40: "p-10",
		48: "p-12",
	};

	return (
		<ShadedCard
			className={cn(
				"rounded-2xl border-none shadow-none bg-card",
				paddingClasses[padding as keyof typeof paddingClasses] || "p-6",
				className,
			)}
		>
			{children}
		</ShadedCard>
	);
};
