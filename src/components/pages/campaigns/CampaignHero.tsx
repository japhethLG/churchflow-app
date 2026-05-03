"use client";

import type { ReactNode } from "react";
import { type components, nstr } from "@/lib/api";
import dayjs from "@/lib/dayjs";

type Campaign = components["schemas"]["CampaignWithItemsResponseDto"];

const STATUS_LABEL: Record<Campaign["status"], string> = {
	DRAFT: "Draft",
	ACTIVE: "Active",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

const fmtDeadline = (d: string | null): string => {
	if (!d) {
		return "Open-ended · no deadline";
	}
	const date = dayjs(d);
	const days = date.diff(dayjs(), "day");
	const fmt = date.format("MMMM D, YYYY");
	if (days < 0) {
		return `Deadline · ${fmt} (passed)`;
	}
	if (days === 0) {
		return `Deadline · ${fmt} (today)`;
	}
	return `Deadline · ${fmt} (${days} days left)`;
};

export const CampaignHero = ({
	campaign,
	actions,
}: {
	campaign: Campaign;
	actions?: ReactNode;
}) => {
	const isActive = campaign.status === "ACTIVE";
	return (
		<div
			style={{
				background: isActive
					? `linear-gradient(135deg, var(--ring), var(--primary))`
					: "var(--muted)",
				borderRadius: 20,
				padding: "28px 32px",
				color: isActive ? "#fff" : "var(--foreground)",
				marginBottom: 24,
				display: "flex",
				justifyContent: "space-between",
				alignItems: "flex-start",
				gap: 24,
			}}
		>
			<div style={{ minWidth: 0, flex: 1 }}>
				<div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
					<Pill bg={isActive ? "rgba(255,255,255,0.2)" : "var(--secondary)"}>
						{STATUS_LABEL[campaign.status]}
					</Pill>
				</div>
				<h1
					style={{
						fontSize: 32,
						fontWeight: 600,
						letterSpacing: "-0.025em",
						margin: 0,
						lineHeight: 1.15,
					}}
				>
					{campaign.title}
				</h1>
				<div
					style={{
						fontSize: 14,
						opacity: isActive ? 0.85 : 1,
						color: isActive ? "#fff" : "var(--muted-foreground)",
						marginTop: 8,
					}}
				>
					{fmtDeadline(nstr(campaign.deadline))}
				</div>
				{nstr(campaign.description) && (
					<p
						style={{
							margin: "16px 0 0",
							fontSize: 14,
							lineHeight: 1.6,
							maxWidth: 640,
							opacity: isActive ? 0.9 : 1,
							color: isActive ? "#fff" : "var(--secondary-foreground)",
						}}
					>
						{nstr(campaign.description)}
					</p>
				)}
			</div>
			{actions && (
				<div style={{ display: "flex", gap: 8, flexShrink: 0 }}>{actions}</div>
			)}
		</div>
	);
};

const Pill = ({ children, bg }: { children: ReactNode; bg: string }) => {
	return (
		<span
			style={{
				background: bg,
				padding: "3px 10px",
				borderRadius: 9999,
				fontSize: 12,
				fontWeight: 500,
			}}
		>
			{children}
		</span>
	);
};
