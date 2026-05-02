import type { ReactNode } from "react";

export const AccountMenuSectionLabel = ({
	children,
}: {
	children: ReactNode;
}) => (
	<div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
		{children}
	</div>
);
