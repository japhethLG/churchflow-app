"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

function formatSegment(segment: string) {
	if (segment.length >= 20 || /^\d+$/.test(segment)) {
		return "Details";
	}
	return segment
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export function DynamicBreadcrumbs() {
	const pathname = usePathname();

	if (!pathname || pathname === "/") {
		return null;
	}

	const segments = pathname.split("/").filter(Boolean);

	let startIndex = 0;
	const isSuperAdmin = segments[0] === "super-admin";

	if (isSuperAdmin) {
		startIndex = 1;
	} else if (
		segments.length >= 2 &&
		(segments[1] === "admin" || segments[1] === "member")
	) {
		startIndex = 2;
	}

	const basePath = `/${segments.slice(0, startIndex).join("/")}`;
	const featureSegments = segments.slice(startIndex);

	const items: { label: string; href: string }[] = [];

	if (isSuperAdmin) {
		items.push({ label: "Super Admin", href: "/super-admin/tenants" });
	}

	let currentPath = basePath;
	for (let i = 0; i < featureSegments.length; i++) {
		const segment = featureSegments[i];
		currentPath += `/${segment}`;

		if (isSuperAdmin && segment === "tenants" && i === 0) {
			items[0].label = "Tenants";
			items[0].href = currentPath;
			continue;
		}

		if (isSuperAdmin && segment === "admins" && i === 0) {
			items[0].label = "Platform Admins";
			items[0].href = currentPath;
			continue;
		}

		if (segment === "my-transactions") {
			items.push({ label: "My Transactions", href: currentPath });
			continue;
		}

		if (segment === "my-pledges") {
			items.push({ label: "My Pledges", href: currentPath });
			continue;
		}

		items.push({
			label: formatSegment(segment),
			href: currentPath,
		});
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{items.map((item, index) => {
					const isLast = index === items.length - 1;

					return (
						<React.Fragment key={item.href}>
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>
										<span className="font-medium  italic text-gray-600">
											{item.label}
										</span>
									</BreadcrumbPage>
								) : (
									<BreadcrumbLink render={<Link href={item.href} />}>
										<span className="font-medium italic text-gray-400 hover:text-gray-600">
											{item.label}
										</span>
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{(!isLast || index === 0) && <BreadcrumbSeparator />}
						</React.Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
