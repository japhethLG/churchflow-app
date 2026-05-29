"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { Pressable } from "@/components/primitives/Pressable";
import { useMobileActionsStore } from "@/lib/mobile-actions/store";
import { cn } from "@/lib/utils";

// Shared anchor: bottom-right, clear of the bottom nav bar. Matches the slot
// the old floating "More" button used to occupy.
const ANCHOR =
	"pointer-events-auto fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-50 md:hidden";

const FAB_SHADOW =
	"shadow-[0_8px_24px_rgba(91,84,240,0.4),0_2px_6px_rgba(0,0,0,0.25)]";

/**
 * Mobile-only floating action button for the current page's primary action(s),
 * driven by `useMobileActions`. One action renders as a single tap target; two
 * or more fan out as a speed dial — a modern, labelled radial menu — with the
 * trigger's plus rotating into a close affordance. Renders nothing when the
 * page registers no actions.
 */
export const MobilePageFab = () => {
	const actions = useMobileActionsStore((s) => s.actions);
	const [open, setOpen] = useState(false);

	// Collapse whenever the action set changes (i.e. on navigation) so a dial
	// left open never strands onto the next page.
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset on action-set change
	useEffect(() => {
		setOpen(false);
	}, [actions]);

	if (actions.length === 0) {
		return null;
	}

	// ── Single action — a compact round FAB that fires directly ──────────────
	if (actions.length === 1) {
		const a = actions[0];
		return (
			<div className={ANCHOR}>
				<Pressable
					onClick={a.onClick}
					aria-label={a.label}
					className={cn(
						"grid size-14 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-90",
						FAB_SHADOW,
					)}
				>
					<Icon name={a.icon} size={24} />
				</Pressable>
			</div>
		);
	}

	// ── Multiple actions — speed dial ────────────────────────────────────────
	// Rendered top-to-bottom; the action nearest the trigger animates in first.
	const fanned = [...actions].reverse();
	return (
		<>
			{/* Scrim — dims the page and captures the dismiss tap. */}
			<Pressable
				onClick={() => setOpen(false)}
				aria-label="Close actions"
				tabIndex={open ? 0 : -1}
				className={cn(
					"fixed inset-0 z-[45] bg-background/50 backdrop-blur-[1px] transition-opacity duration-200 md:hidden",
					open ? "opacity-100" : "pointer-events-none opacity-0",
				)}
			/>

			<div className={cn(ANCHOR, "flex flex-col items-end gap-3")}>
				{fanned.map((a, i) => {
					// Stagger from the trigger upward: last in the column (nearest the
					// FAB) leads.
					const delay = open ? (fanned.length - 1 - i) * 45 : 0;
					return (
						<div
							key={a.label}
							style={{ transitionDelay: `${delay}ms` }}
							className={cn(
								"flex items-center gap-3 transition-all duration-200 ease-out",
								open
									? "translate-y-0 scale-100 opacity-100"
									: "pointer-events-none translate-y-3 scale-90 opacity-0",
							)}
						>
							<span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background shadow-lg">
								{a.label}
							</span>
							<Pressable
								onClick={() => {
									setOpen(false);
									a.onClick();
								}}
								aria-label={a.label}
								className="grid size-12 place-items-center rounded-full bg-card text-foreground shadow-lg ring-1 ring-border/60 transition-transform active:scale-90"
							>
								<Icon name={a.icon} size={20} />
							</Pressable>
						</div>
					);
				})}

				{/* Trigger — plus rotates 135° into a close glyph when open. */}
				<Pressable
					onClick={() => setOpen((v) => !v)}
					aria-label={open ? "Close actions" : "Page actions"}
					aria-expanded={open}
					className={cn(
						"grid size-14 place-items-center rounded-full bg-primary text-primary-foreground transition-transform active:scale-95",
						FAB_SHADOW,
					)}
				>
					<Icon
						name="plus"
						size={26}
						className={cn(
							"transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
							open && "rotate-135",
						)}
					/>
				</Pressable>
			</div>
		</>
	);
};
