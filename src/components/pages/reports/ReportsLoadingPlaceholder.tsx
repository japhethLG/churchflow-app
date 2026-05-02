"use client";

import { Card } from "@/components/primitives";

export const ReportsLoadingPlaceholder = () => {
	return (
		<div className="mb-6 grid grid-cols-[1fr_1.3fr] gap-4">
			{[0, 1].map((i) => (
				<Card key={i}>
					<div className="mb-4 h-4 w-[120px] rounded bg-secondary" />
					<div className="h-60 rounded-lg bg-secondary/50" />
				</Card>
			))}
		</div>
	);
};
