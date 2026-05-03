export const AccountIdentityHeader = ({
	userName,
	userEmail,
}: {
	userName: string;
	userEmail?: string;
}) => (
	<div className="mb-1 border-b border-border/60 px-2.5 pb-2 pt-2.5">
		<div className="truncate text-sm font-semibold text-foreground">
			{userName}
		</div>
		{userEmail && (
			<div className="mt-0.5 truncate text-xs text-muted-foreground">
				{userEmail}
			</div>
		)}
	</div>
);
