"use client";

import { Amount, Card, SectionTitle, StatCard } from "@/components/primitives";
import type { components } from "@/lib/api";

type Progress = components["schemas"]["CampaignProgressResponseDto"];

const pct = (n: number, d: number): number => {
	if (d <= 0) {
		return 0;
	}
	return Math.min(100, Math.round((n / d) * 100));
};

export const CampaignProgressCard = ({
	progress,
	loading,
}: {
	progress: Progress | undefined;
	loading?: boolean;
}) => {
	if (loading || !progress) {
		return (
			<Card padding={24}>
				<SectionTitle title="Progress" />
				<div
					style={{
						height: 16,
						background: "var(--secondary)",
						borderRadius: 6,
						width: "60%",
						marginBottom: 12,
					}}
				/>
				<div
					style={{
						height: 16,
						background: "var(--secondary)",
						borderRadius: 6,
						width: "40%",
					}}
				/>
			</Card>
		);
	}

	const goal = progress.goalAmount;
	const pledged = progress.pledgedAmount;
	const raised = progress.raisedAmount;
	const pledgedPct = pct(pledged, goal);
	const raisedPct = pct(raised, goal);

	return (
		<Card padding={24}>
			<SectionTitle title="Progress" />

			<div
				style={{
					display: "grid",
					gridTemplateColumns: "repeat(3, 1fr)",
					gap: 12,
					marginBottom: 20,
				}}
			>
				<StatCard
					label="Goal"
					value={<Amount value={goal.toString()} />}
					caption={`${progress.items.length} items`}
				/>
				<StatCard
					label="Pledged"
					value={<Amount value={pledged.toString()} />}
					caption={`${pledgedPct}% of goal · ${progress.pledgeCount} pledges`}
				/>
				<StatCard
					label="Raised"
					value={<Amount value={raised.toString()} />}
					caption={`${raisedPct}% of goal`}
				/>
			</div>

			{/* Stacked bar: raised (filled) on top of pledged (track), in a goal lane */}
			<div style={{ marginTop: 4 }}>
				<div
					style={{
						position: "relative",
						height: 12,
						background: "var(--secondary)",
						borderRadius: 9999,
						overflow: "hidden",
					}}
				>
					<div
						style={{
							position: "absolute",
							inset: 0,
							width: `${pledgedPct}%`,
							background: "var(--input)",
						}}
					/>
					<div
						style={{
							position: "absolute",
							inset: 0,
							width: `${raisedPct}%`,
							background: `linear-gradient(135deg, var(--ring), var(--primary))`,
						}}
					/>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						marginTop: 8,
						fontSize: 11,
						color: "var(--muted-foreground)",
						letterSpacing: "0.04em",
						textTransform: "uppercase",
					}}
				>
					<span>
						<span
							style={{
								display: "inline-block",
								width: 8,
								height: 8,
								background: "var(--primary)",
								borderRadius: 9999,
								marginRight: 6,
							}}
						/>
						Raised
					</span>
					<span>
						<span
							style={{
								display: "inline-block",
								width: 8,
								height: 8,
								background: "var(--input)",
								borderRadius: 9999,
								marginRight: 6,
							}}
						/>
						Pledged
					</span>
					<span>
						<span
							style={{
								display: "inline-block",
								width: 8,
								height: 8,
								background: "var(--secondary)",
								borderRadius: 9999,
								marginRight: 6,
							}}
						/>
						Goal remaining
					</span>
				</div>
			</div>
		</Card>
	);
};
