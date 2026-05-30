// Generic page-content skeleton shown by the (admin)/(member) route-group
// loading.tsx files while a page segment renders. The AppShell chrome
// (sidebar / top bar / bottom nav) is rendered by the group layout and stays
// put, so this only fills the scrollable content area — turning a frozen
// previous page into an instant "this route is loading" paint.
//
// Pure CSS pulse, no client JS, so it streams immediately from the server.
const Bar = ({ className = "" }: { className?: string }) => (
	<div className={`animate-pulse rounded-md bg-muted ${className}`} />
);

export const PageContentSkeleton = () => (
	<div className="flex h-full flex-col">
		{/* Header */}
		<div className="px-4 pt-5 md:px-8 md:pt-6">
			<Bar className="h-3 w-28" />
			<Bar className="mt-3 h-7 w-64 max-w-[70%]" />
			<Bar className="mt-2 h-3 w-48 max-w-[55%]" />
		</div>

		<div className="flex-1 px-4 pb-36 pt-6 md:px-8 md:pb-8">
			{/* KPI strip */}
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
				{[0, 1, 2, 3].map((i) => (
					<div key={i} className="rounded-xl border border-border p-4">
						<Bar className="h-3 w-16" />
						<Bar className="mt-3 h-6 w-24" />
					</div>
				))}
			</div>

			{/* Two content cards */}
			<div className="mt-6 grid gap-4 lg:grid-cols-2">
				{[0, 1].map((i) => (
					<div key={i} className="rounded-xl border border-border p-5">
						<Bar className="h-4 w-40" />
						<div className="mt-4 space-y-3">
							{[0, 1, 2, 3].map((r) => (
								<div key={r} className="flex items-center gap-3">
									<Bar className="size-9 shrink-0 rounded-full" />
									<Bar className="h-3 flex-1" />
									<Bar className="h-3 w-14 shrink-0" />
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	</div>
);
