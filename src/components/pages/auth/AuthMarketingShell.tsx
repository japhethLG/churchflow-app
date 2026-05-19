import type { ReactNode } from "react";

import { Wordmark } from "@/components/primitives/Wordmark";
import { cn } from "@/lib/utils";

/** Shared (auth) chrome: wordmark header + centered panel. Used by invite + select-church. */
export const AuthMarketingShell = ({
	children,
	panel = "card-narrow",
}: {
	children: ReactNode;
	panel?: "card-narrow" | "plain-wide";
}) => {
	return (
		<>
			<div className="px-10 py-7">
				<Wordmark size="lg" />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-10">
				<div
					className={cn(
						"w-full",
						panel === "card-narrow" &&
							"max-w-[480px] rounded-3xl bg-card p-10 shadow-sm",
						panel === "plain-wide" && "max-w-[720px]",
					)}
				>
					{children}
				</div>
			</div>
		</>
	);
};
