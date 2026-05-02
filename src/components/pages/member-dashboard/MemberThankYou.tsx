"use client";

import dayjs from "@/lib/dayjs";

const MESSAGES = [
	"Thank you for your faithful giving, {name}. Your contributions this month are helping sustain our weekly ministries.",
	"Your generosity makes a real difference, {name}. Every gift supports the work of this community.",
	"Thank you for being a cheerful giver, {name}. Your faithfulness inspires others around you.",
	"Your giving matters, {name}. Together, we're building something that lasts.",
];

export const MemberThankYou = ({ name }: { name: string }) => {
	const dayIndex = dayjs().date() % MESSAGES.length;
	const message = MESSAGES[dayIndex].replace("{name}", name);

	return (
		<div className="mb-4 flex items-center gap-4 rounded-2xl bg-[linear-gradient(90deg,var(--tertiary-container),var(--card))] px-7 py-5">
			<div className="grid size-10 shrink-0 place-items-center rounded-full bg-tertiary/20">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					className="text-tertiary"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
				</svg>
			</div>
			<div className="min-w-0 flex-1">
				<div className="text-[15px] italic leading-snug tracking-tight text-tertiary">
					&ldquo;{message}&rdquo;
				</div>
			</div>
		</div>
	);
};
