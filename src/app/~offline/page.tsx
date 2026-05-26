export const metadata = { title: "Offline · ChurchFlow" };

export default () => (
	<main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
		<h1 className="text-xl font-semibold">You're offline</h1>
		<p className="text-muted-foreground max-w-sm text-sm">
			ChurchFlow needs a connection to load this page. Reconnect and try again.
		</p>
	</main>
);
