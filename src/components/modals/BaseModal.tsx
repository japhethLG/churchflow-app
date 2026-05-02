"use client";

import { type ReactNode, useEffect } from "react";
import { Button } from "@/components/primitives/Button";
import { cn } from "@/lib/utils";

// Shell every modal renders inside. Owns the overlay, ESC-to-close,
// backdrop click, header (overline + title + close), body, and footer.

type Size = "sm" | "md" | "lg" | "xl";

export type ModalAction = {
	label: string;
	onClick: () => void;
	loading?: boolean;
	disabled?: boolean;
	variant?: "primary" | "secondary" | "tertiary";
	destructive?: boolean;
};

type BaseModalProps = {
	overline?: string;
	title: string;
	showClose?: boolean;
	children: ReactNode;
	primaryAction?: ModalAction;
	secondaryAction?: ModalAction;
	footerHint?: string;
	size?: Size;
	onClose: () => void;
	dismissible?: boolean;
};

const SIZE_CLASS: Record<Size, string> = {
	sm: "max-w-[400px]",
	md: "max-w-[560px]",
	lg: "max-w-[720px]",
	xl: "max-w-[920px]",
};

export const BaseModal = ({
	overline,
	title,
	showClose = true,
	children,
	primaryAction,
	secondaryAction,
	footerHint,
	size = "md",
	onClose,
	dismissible = true,
}: BaseModalProps) => {
	useEffect(() => {
		if (!dismissible) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [dismissible, onClose]);

	const hasFooter = primaryAction || secondaryAction || footerHint;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label={title}
			className="fixed inset-0 z-1000 grid place-items-center p-6"
			style={{
				background: "rgba(53, 37, 205, 0.18)",
				backdropFilter: "blur(8px)",
			}}
			onClick={(e) => {
				if (e.target === e.currentTarget && dismissible) onClose();
			}}
			onKeyDown={
				dismissible
					? (e) => {
							if (
								e.target === e.currentTarget &&
								(e.key === "Enter" || e.key === " ")
							)
								onClose();
						}
					: undefined
			}
		>
			<div
				className={cn(
					"flex w-full flex-col overflow-hidden rounded-[24px] bg-card shadow-[0_30px_80px_-20px_rgba(79,70,229,0.35)]",
					SIZE_CLASS[size],
				)}
			>
				<div className="flex justify-between px-8 pt-6">
					<div>
						{overline && (
							<div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
								{overline}
							</div>
						)}
						<h2 className="m-0 text-[22px] font-semibold tracking-tight text-foreground">
							{title}
						</h2>
					</div>
					{showClose && (
						<button
							type="button"
							className="grid size-9 shrink-0 place-items-center rounded-full border-0 bg-muted text-muted-foreground hover:opacity-90"
							onClick={onClose}
							aria-label="Close"
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 16 16"
								fill="none"
								aria-hidden="true"
							>
								<path
									d="M12 4L4 12M4 4l8 8"
									stroke="currentColor"
									strokeWidth="1.5"
									strokeLinecap="round"
								/>
							</svg>
						</button>
					)}
				</div>

				<div className="flex-1 overflow-y-auto p-8">{children}</div>

				{hasFooter && (
					<div
						className={cn(
							"flex items-center gap-2 border-t border-border bg-card px-8 py-5",
							footerHint && (secondaryAction || primaryAction)
								? "justify-between"
								: "justify-end",
						)}
					>
						{footerHint ? (
							<span className="text-[11px] text-muted-foreground">
								{footerHint}
							</span>
						) : (
							<span />
						)}
						<div className="flex gap-2">
							{secondaryAction && (
								<Button
									variant={secondaryAction.variant ?? "tertiary"}
									destructive={secondaryAction.destructive}
									onClick={secondaryAction.onClick}
									disabled={secondaryAction.disabled || secondaryAction.loading}
								>
									{secondaryAction.label}
								</Button>
							)}
							{primaryAction && (
								<Button
									variant={primaryAction.variant ?? "primary"}
									destructive={primaryAction.destructive}
									onClick={primaryAction.onClick}
									disabled={primaryAction.disabled || primaryAction.loading}
								>
									{primaryAction.loading ? "Saving…" : primaryAction.label}
								</Button>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
