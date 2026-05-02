"use client";

import {
	Amount,
	Button,
	Card,
	Icon,
	RowActionsMenu,
	SectionTitle,
} from "@/components/primitives";
import { type components, nstr } from "@/lib/api";

type Item = components["schemas"]["CampaignItemResponseDto"];
type ItemProgress = components["schemas"]["CampaignItemProgressDto"];

const pct = (n: number, d: number): number => {
	if (d <= 0) return 0;
	return Math.min(100, Math.round((n / d) * 100));
};

export const CampaignItemsList = ({
	items,
	progressByItemId,
	onAdd,
	onEdit,
	onDelete,
	disabled,
}: {
	items: Item[];
	progressByItemId: Record<string, ItemProgress>;
	onAdd: () => void;
	onEdit: (item: Item) => void;
	onDelete: (item: Item) => void;
	disabled?: boolean;
}) => {
	return (
		<Card padding={24}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<SectionTitle title="Line items" />
				<Button
					variant="secondary"
					size="sm"
					icon="plus"
					onClick={onAdd}
					disabled={disabled}
				>
					Add item
				</Button>
			</div>

			{items.length === 0 ? (
				<div
					style={{
						padding: "32px 16px",
						border: `1.5px dashed ${"var(--input)"}`,
						borderRadius: 12,
						textAlign: "center",
						color: "var(--muted-foreground)",
						fontSize: 13,
					}}
				>
					<p style={{ margin: 0, marginBottom: 8 }}>
						This campaign has no line items yet.
					</p>
					<p style={{ margin: 0, fontSize: 12 }}>
						The campaign goal is the sum of its items&apos; targets — add at
						least one to start tracking pledges.
					</p>
				</div>
			) : (
				<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
					{items.map((item) => {
						const p = progressByItemId[item.id];
						const target = item.targetAmount;
						const pledged = p?.pledgedAmount ?? 0;
						const raised = p?.raisedAmount ?? 0;
						const raisedPct = pct(raised, target);
						const pledgedPct = pct(pledged, target);
						return (
							<div
								key={item.id}
								style={{
									display: "grid",
									gridTemplateColumns: "1fr auto 32px",
									gap: 16,
									alignItems: "center",
									padding: 16,
									background: "var(--muted)",
									borderRadius: 12,
								}}
							>
								<div style={{ minWidth: 0 }}>
									<div
										style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}
									>
										{item.title}
									</div>
									{nstr(item.description) && (
										<div
											style={{
												fontSize: 12,
												color: "var(--muted-foreground)",
												marginBottom: 8,
											}}
										>
											{nstr(item.description)}
										</div>
									)}
									<div
										style={{
											position: "relative",
											height: 6,
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
											gap: 12,
											marginTop: 6,
											fontSize: 11,
											color: "var(--muted-foreground)",
										}}
									>
										<span>
											Raised <Amount value={raised.toString()} /> /{" "}
											<Amount value={target.toString()} /> ({raisedPct}%)
										</span>
										{pledged > raised && (
											<span>
												Pledged <Amount value={pledged.toString()} /> (
												{pledgedPct}%)
											</span>
										)}
									</div>
								</div>
								<div style={{ textAlign: "right" }}>
									<div
										style={{
											fontSize: 11,
											color: "var(--muted-foreground)",
											textTransform: "uppercase",
											letterSpacing: "0.05em",
										}}
									>
										Target
									</div>
									<Amount value={target.toString()} />
								</div>
								<div style={{ display: "grid", placeItems: "end" }}>
									<RowActionsMenu
										actions={[
											{ label: "Edit", onClick: () => onEdit(item) },
											{
												label: "Delete",
												onClick: () => onDelete(item),
												destructive: true,
												separatorBefore: true,
											},
										]}
									/>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</Card>
	);
};
