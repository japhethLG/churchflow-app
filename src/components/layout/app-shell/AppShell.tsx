import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type Perspective, Sidebar, type TenantSummary } from "../sidebar";
import { TopBar } from "../top-bar";

export const AppShell = ({
	perspective,
	tenantSlug,
	churchName,
	userName,
	userEmail,
	memberships,
	isSuperAdmin,
	children,
	bg,
}: {
	perspective: Perspective;
	tenantSlug?: string;
	churchName?: string;
	userName: string;
	userEmail?: string;
	memberships?: TenantSummary[];
	isSuperAdmin?: boolean;
	children: ReactNode;
	bg?: string;
}) => {
	return (
		<div
			className={cn(
				"flex min-h-screen w-full font-sans text-foreground",
				!bg && "bg-background",
			)}
		>
			<Sidebar
				perspective={perspective}
				tenantSlug={tenantSlug}
				churchName={churchName}
				userName={userName}
				userEmail={userEmail}
				memberships={memberships}
				isSuperAdmin={isSuperAdmin}
			/>
			<div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
				<TopBar />
				<div className="flex-1 overflow-auto">{children}</div>
			</div>
		</div>
	);
};
