"use client";

import { Card, Icon, Input, PageHeader } from "@/components/primitives";
import { useAuthMe } from "@/lib/api/auth";

export const SuperAdminProfile = () => {
	const { data: user } = useAuthMe();

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline="Platform"
				title="Super Admin Profile"
				subtitle="Manage your platform-wide account details."
			/>

			<div className="overflow-auto flex-1 px-4 pb-36 md:px-8 md:pb-8">
				<div className="w-full max-w-xl">
					<Card>
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
							<div className="text-sm text-secondary-foreground">
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
