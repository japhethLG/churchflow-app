import Link from "next/link";
import { Button, Wordmark } from "@/components/primitives";

export default () => (
	<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
		<Wordmark size="lg" />
		<div className="flex flex-col gap-2">
			<h1 className="text-[64px] font-bold tracking-tight text-foreground">
				Church not found
			</h1>
			<p className="m-0 max-w-md text-base text-muted-foreground">
				This church doesn&apos;t exist, or you don&apos;t have access to it.
			</p>
		</div>
		<Link href="/">
			<Button>Back to your churches</Button>
		</Link>
	</div>
);
