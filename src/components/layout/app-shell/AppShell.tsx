import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { type Perspective, Sidebar, type TenantSummary } from "../sidebar";
import { TopBar } from "../top-bar";

export const AppShell = ({
	perspective,
	tenantSlug,
	breadcrumb,
	churchName,
	userName,
	userEmail,
	memberships,
	isSuperAdmin,
	children,
	contentPad = 32,
	bg,
}: {
	perspective: Perspective;
	tenantSlug?: string;
	breadcrumb?: string;
	churchName?: string;
	userName: string;
	userEmail?: string;
	memberships?: TenantSummary[];
	isSuperAdmin?: boolean;
	children: ReactNode;
	contentPad?: number;
	bg?: string;
}) => {
	return (
		<div
			className={cn(
				"flex min-h-screen w-full font-sans text-foreground",
				!bg && "bg-background",
			)}
			style={bg ? { background: bg } : undefined}
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
				<TopBar breadcrumb={breadcrumb} />
				<div
					className="flex-1 overflow-auto"
					// style={{
					// 	paddingLeft: contentPad,
					// 	paddingRight: contentPad,
					// 	paddingBottom: contentPad,
					// }}
				>
					{children}
				</div>
			</div>
		</div>
	);
};
