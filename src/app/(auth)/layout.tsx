import type { ReactNode } from "react";

export default ({ children }: { children: ReactNode }) => {
	return (
		<div className="flex min-h-screen flex-col bg-[linear-gradient(135deg,var(--accent)_0%,#FFFFFF_55%,var(--tertiary-container)_120%)] dark:bg-[radial-gradient(ellipse_at_top_left,var(--accent)_0%,var(--background)_60%)] font-sans antialiased">
			{children}
		</div>
	);
};
