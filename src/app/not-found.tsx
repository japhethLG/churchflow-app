import Link from "next/link";
import { Button, Wordmark } from "@/components/primitives";

export default () => (
	<div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
		<Wordmark size="lg" />
		<div className="flex flex-col gap-2">
			<h1 className="text-6xl font-bold tracking-tight text-foreground">404</h1>
			<p className="m-0 text-base text-muted-foreground">
				We couldn&apos;t find the page you were looking for.
			</p>
		</div>
		<Link href="/">
			<Button role="primary">Back to dashboard</Button>
		</Link>
	</div>
);
