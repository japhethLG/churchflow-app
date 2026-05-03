"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { Form, FormInput } from "@/components/formElements";
import {
	Button,
	Card,
	PageHeader,
	SectionTitle,
} from "@/components/primitives";
import { nstr } from "@/lib/api/coerce";
import { useTenant, useUpdateTenant } from "@/lib/api/tenants";
import { type SettingsFormValues, settingsSchema } from "./formHelpers";

export const SettingsPage = ({ tenantSlug }: { tenantSlug: string }) => {
	const tenantQ = useTenant(tenantSlug);
	const tenant = tenantQ.data;
	const updateTenant = useUpdateTenant();

	const [saved, setSaved] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const methods = useForm<SettingsFormValues>({
		resolver: zodResolver(settingsSchema),
		defaultValues: {
			name: "",
			address: "",
			phone: "",
			email: "",
		},
	});

	const {
		reset,
		handleSubmit,
		formState: { isDirty },
	} = methods;

	useEffect(() => {
		if (tenant) {
			reset({
				name: tenant.name,
				address: nstr(tenant.address) ?? "",
				phone: nstr(tenant.phone) ?? "",
				email: nstr(tenant.email) ?? "",
			});
		}
	}, [tenant, reset]);

	const onSubmit: SubmitHandler<SettingsFormValues> = async (values) => {
		if (!tenant) {
			return;
		}
		setError(null);
		try {
			await updateTenant.mutateAsync({
				params: { path: { tenantId: tenantSlug } },
				body: {
					...values,
					address: values.address?.trim() || undefined,
					phone: values.phone?.trim() || undefined,
					email: values.email?.trim() || undefined,
				},
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 3000);
			reset(values);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save");
		}
	};

	if (tenantQ.isLoading) {
		return (
			<div className="h-full flex flex-col">
				<PageHeader
					className="px-8"
					overline="Configuration"
					title="Settings."
					subtitle="Loading..."
				/>
				<div className="overflow-auto flex-1 px-8 pb-8 flex flex-col gap-4">
					{[0, 1, 2].map((i) => (
						<Card key={i}>
							<div className="mb-5 h-4 w-40 animate-pulse rounded bg-secondary" />
							<div className="mb-3 h-11 animate-pulse rounded-lg bg-secondary" />
							<div className="h-11 animate-pulse rounded-lg bg-secondary" />
						</Card>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<PageHeader
				className="px-8"
				overline="Configuration"
				title="Settings"
				subtitle="Manage your church profile."
				action={
					<div className="mr-2.5 flex items-center gap-2.5">
						{saved && (
							<span className="text-sm font-medium text-success">✓ Saved</span>
						)}
						<Button
							variant="primary"
							onClick={handleSubmit(onSubmit)}
							disabled={!isDirty || updateTenant.isPending}
						>
							{updateTenant.isPending ? "Saving…" : "Save changes"}
						</Button>
					</div>
				}
			/>

			<div className="overflow-auto flex-1 px-8 pb-8">
				{error && (
					<div className="mb-4 rounded-[10px] bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				)}

				<Form<SettingsFormValues>
					methods={methods}
					onSubmit={onSubmit}
					className="w-2xl gap-5"
				>
					<Card>
						<SectionTitle title="Church profile" />
						<div className="flex flex-col gap-4">
							<FormInput
								inputName="name"
								label="Church name"
								placeholder="Grace Community Church"
							/>
							<FormInput
								inputName="address"
								label="Address"
								placeholder="123 Main St, Anytown, CA"
							/>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<FormInput
									inputName="phone"
									label="Phone"
									type="tel"
									placeholder="+1 555-555-0123"
								/>
								<FormInput
									inputName="email"
									label="Email"
									type="email"
									placeholder="office@example.com"
								/>
							</div>
						</div>
					</Card>

					<Card>
						<SectionTitle title="Identifiers" />
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<span className="mb-1.5 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">
									Slug
								</span>
								<div className="rounded-[10px] bg-muted px-3.5 py-2.5 font-mono text-sm text-muted-foreground">
									{tenant?.slug ?? tenantSlug}
								</div>
								<p className="mt-1 text-xs text-muted-foreground">
									Only super-admins can change this.
								</p>
							</div>
							<div>
								<span className="mb-1.5 block text-sm font-semibold uppercase tracking-wide text-muted-foreground">
									Tenant ID
								</span>
								<div className="truncate overflow-hidden rounded-[10px] bg-muted px-3.5 py-2.5 font-mono text-sm text-muted-foreground">
									{tenant?.id ?? "—"}
								</div>
							</div>
						</div>
					</Card>
				</Form>
			</div>
		</div>
	);
};
