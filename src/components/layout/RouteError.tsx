"use client";

import { Button } from "@/components/primitives";

// Shared content for the (admin)/(member) route-group error.tsx boundaries.
// Renders inside the persistent AppShell, so a thrown error in a page segment
// shows a recoverable message + retry instead of blanking the whole app.
export const RouteError = ({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) => (
	<div className="grid h-full place-items-center px-4 py-16 text-center">
		<div className="max-w-sm">
			<h2 className="text-lg font-bold text-foreground">
				Something went wrong
			</h2>
			<p className="mt-2 text-sm text-muted-foreground">
				{error.message || "This page failed to load. Please try again."}
			</p>
			<div className="mt-5 flex justify-center">
				<Button role="primary" onClick={reset}>
					Try again
				</Button>
			</div>
		</div>
	</div>
);
