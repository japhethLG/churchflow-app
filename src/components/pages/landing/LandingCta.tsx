"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/primitives/Button";

export const LandingCta = ({
	isAuthenticated,
}: {
	isAuthenticated: boolean;
}) => {
	const router = useRouter();
	const href = isAuthenticated ? "/launch" : "/login";
	const label = isAuthenticated ? "Open your dashboard" : "Start in seconds";

	return (
		<section className="relative px-4 pb-24 sm:px-6 lg:px-10">
			<div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-linear-to-br from-primary via-ring to-tertiary p-10 text-center text-white shadow-[0_30px_60px_-20px_rgba(53,37,205,0.4)] sm:p-16">
				<div
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 opacity-30"
					style={{
						backgroundImage:
							"radial-gradient(circle at 20% 10%, rgba(255,255,255,0.45), transparent 40%), radial-gradient(circle at 80% 90%, rgba(255,255,255,0.35), transparent 40%)",
					}}
				/>
				<div className="relative">
					<h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
						A calmer Sunday is one click away.
					</h2>
					<p className="mx-auto mt-4 max-w-xl text-pretty text-base text-white/85 sm:text-lg">
						Spin up your church in ChurchFlow today. No card, no migration
						spreadsheet, no waiting room.
					</p>
					<div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Button
							role="secondary"
							size="lg"
							iconRight="arrowRight"
							onClick={() => router.push(href)}
						>
							{label}
						</Button>
					</div>
				</div>
			</div>
		</section>
	);
};
