"use client";

import { Card, Icon, Input, PageHeader } from "@/components/primitives";
import { useAuthMe } from "@/lib/api/auth";

export const SuperAdminProfile = () => {
	const { data: user } = useAuthMe();

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Platform"
				title="Super Admin Profile"
				subtitle="Manage your platform-wide account details."
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				<div className="max-w-[640px]">
					<Card className="mt-6">
						<div className="mb-4">
							<Input
								label="Display name"
								value={user?.displayName ?? ""}
								readOnly
								disabled
								placeholder="—"
							/>
						</div>

						<div className="mt-4">
							<Input
								label="Email address"
								icon="mail"
								value={user?.email ?? ""}
								readOnly
								disabled
								helper="Email is managed by your platform sign-in."
							/>
						</div>

						<div className="mt-8 flex items-center gap-3 rounded-xl bg-muted p-4">
							<Icon name="settings" size={20} className="text-primary" />
							<div className="text-[13px] text-secondary-foreground">
								Super Admin profiles are currently managed via the platform
								identity provider.
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
};
