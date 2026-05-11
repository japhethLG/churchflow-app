import Link from "next/link";
import { JournalIllustration } from "@/components/illustrations/JournalIllustration";
import { Card } from "@/components/primitives/Card";
import { Wordmark } from "@/components/primitives/Wordmark";
import { LoginButton } from "./LoginButton";

export default () => {
	return (
		<>
			<div className="flex items-center justify-between px-6 py-7 animate-in fade-in duration-700 lg:px-10">
				<Wordmark size="md" />
			</div>

			<div className="flex flex-1 flex-col items-center justify-center gap-12 px-6 lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-20 lg:px-10">
				<div className="w-full max-w-[440px] justify-self-center animate-in fade-in slide-in-from-left-8 duration-700 delay-150 fill-mode-both">
					<Card
						padding={40}
						className="relative overflow-hidden border-border/40"
					>
						{/* Subtle top accent line */}
						<div className="absolute top-0 left-0 h-1 w-full bg-linear-to-r from-primary to-accent" />

						<div className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
							Authentication
						</div>
						<h1 className="m-0 text-4xl font-bold tracking-tight text-foreground leading-[1.1] lg:text-5xl">
							Welcome <br /> back.
						</h1>
						<p className="mt-5 text-base leading-relaxed text-muted-foreground/90">
							Sign in to your church&apos;s dashboard. Your giving history and
							upcoming services will be right where you left them.
						</p>

						<div className="mt-10">
							<LoginButton />
						</div>

						<div className="mt-6 text-center text-[11px] leading-normal text-muted-foreground/60">
							By continuing you agree to our{" "}
							<Link
								href="/terms"
								className="text-muted-foreground font-medium underline decoration-primary/20 transition-colors hover:text-primary"
							>
								Terms
							</Link>{" "}
							and{" "}
							<Link
								href="/privacy"
								className="text-muted-foreground font-medium underline decoration-primary/20 transition-colors hover:text-primary"
							>
								Privacy Policy
							</Link>
							.
						</div>
					</Card>

					<div className="mt-6 text-center text-xs font-medium text-muted-foreground/50">
						New to ChurchFlow?{" "}
						<span className="text-primary/60">
							Ask your admin for an invite.
						</span>
					</div>
				</div>

				<div className="hidden relative h-[500px] w-full max-w-[500px] items-center justify-center justify-self-center animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both lg:flex">
					{/* Decorative soft glow */}
					<div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full" />
					<div className="relative z-10 w-full transform transition-transform hover:scale-[1.02] duration-700">
						<JournalIllustration />
					</div>
				</div>
			</div>

			<div className="flex flex-col gap-4 px-6 py-8 text-[11px] font-medium tracking-wide text-muted-foreground/40 animate-in fade-in duration-700 delay-500 fill-mode-both sm:flex-row sm:justify-between lg:px-10">
				<span className="flex items-center gap-2">
					<div className="size-1 rounded-full bg-muted-foreground/30" />
					Built for churches with heart.
				</span>
				<span className="flex gap-8">
					<Link
						href="/privacy"
						className="hover:text-primary/60 transition-colors cursor-pointer"
					>
						Privacy
					</Link>
					<Link
						href="/terms"
						className="hover:text-primary/60 transition-colors cursor-pointer"
					>
						Terms
					</Link>
					<span className="hover:text-primary/60 transition-colors cursor-pointer">
						Support
					</span>
				</span>
			</div>
		</>
	);
};
