"use client";

import { useParams } from "next/navigation";
import { SettingsPage } from "@/components/pages/settings";

export default () => {
	const { tenantSlug } = useParams<{ tenantSlug: string }>();
	return <SettingsPage tenantSlug={tenantSlug} />;
};
