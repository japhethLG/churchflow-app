"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Icon, Input, PageHeader } from "@/components/primitives";
import { nstr } from "@/lib/api/coerce";
import { useMyProfile, useUpdateMyProfile } from "@/lib/api/members";

export const MemberProfile = ({
	overline = "Account",
	title = "Personal Profile",
}: {
	overline?: string;
	title?: string;
}) => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	const memberQ = useMyProfile(tenantSlug);
	const updateM = useUpdateMyProfile(tenantSlug);

	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		address: "",
	});

	const [saved, setSaved] = useState(false);

	useEffect(() => {
		if (memberQ.data) {
			setForm({
				firstName: nstr(memberQ.data.firstName) ?? "",
				lastName: nstr(memberQ.data.lastName) ?? "",
				email: nstr(memberQ.data.email) ?? "",
				phone: nstr(memberQ.data.phone) ?? "",
				address: nstr(memberQ.data.address) ?? "",
			});
		}
	}, [memberQ.data]);

	const handleSave = async () => {
		try {
			await updateM.mutateAsync({
				params: { path: { tenantId: tenantSlug } },
				body: {
					firstName: form.firstName,
					lastName: form.lastName,
					phone: form.phone,
					address: form.address,
				},
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-4 pt-5 md:px-8 md:pt-0"
				overline={overline}
				title={title}
				subtitle="Manage your contact information and how the church office reaches you."
			/>

			<div className="overflow-auto flex-1 px-4 pb-28 md:px-8 md:pb-8">
				<div className="max-w-2xl">
					<Card className="mt-6">
						<div className="grid grid-cols-2 gap-4">
							<Input
								label="First name"
								value={form.firstName}
								onChange={(e) =>
									setForm({ ...form, firstName: e.target.value })
								}
								placeholder="e.g. Amara"
							/>
							<Input
								label="Last name"
								value={form.lastName}
								onChange={(e) => setForm({ ...form, lastName: e.target.value })}
								placeholder="e.g. Okonkwo"
							/>
						</div>

						<div className="mt-4">
							<Input
								label="Email address"
								icon="mail"
								value={form.email}
								readOnly
								disabled
								helper="Email is managed by your sign-in provider."
							/>
						</div>

						<div className="mt-4">
							<Input
								label="Phone number"
								icon="phone"
								value={form.phone}
								onChange={(e) => setForm({ ...form, phone: e.target.value })}
								placeholder="+1 555 000 0000"
							/>
						</div>

						<div className="mt-4">
							<Input
								label="Home address"
								icon="location"
								value={form.address}
								onChange={(e) => setForm({ ...form, address: e.target.value })}
								placeholder="Street, City, State, ZIP"
							/>
						</div>

						<div className="mt-8 flex items-center justify-between">
							<div className="flex items-center gap-2">
								{saved && (
									<div className="flex items-center gap-1.5 text-sm font-medium text-secondary-foreground">
										<Icon name="check" size={16} className="text-primary" />
										Profile updated successfully
									</div>
								)}
							</div>
							<Button
								role="primary"
								onClick={handleSave}
								loading={updateM.isPending}
								disabled={updateM.isPending}
							>
								Save changes
							</Button>
						</div>
					</Card>

					<div className="mt-10 flex items-start gap-4 rounded-2xl bg-muted p-6">
						<div className="grid size-10 shrink-0 place-items-center rounded-xl bg-input">
							<Icon
								name="bell"
								size={20}
								className="text-secondary-foreground"
							/>
						</div>
						<div>
							<div className="text-sm font-semibold text-foreground">
								Privacy Note
							</div>
							<div className="mt-1 text-sm leading-relaxed text-secondary-foreground">
								Your information is only visible to authorized church
								administrators. We use this data to keep you informed about
								campaigns and to provide accurate giving statements.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
