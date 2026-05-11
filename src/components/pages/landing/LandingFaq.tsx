"use client";

import { useState } from "react";
import { Icon } from "@/components/primitives/Icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Faq = {
	question: string;
	answer: string;
};

const FAQS: Faq[] = [
	{
		question: "Who is ChurchFlow for?",
		answer:
			"Small and mid-sized congregations who want a simple, calm system of record for giving, members, and stewardship — without enterprise-grade complexity.",
	},
	{
		question: "How is my church's data isolated from other churches?",
		answer:
			"Every church is its own tenant in the URL, in the database, and in the auth layer. Members of one church can never read another church's data — we enforce it on the server, not just in the UI.",
	},
	{
		question: "Can the same person belong to more than one church?",
		answer:
			"Yes. A single ChurchFlow account can be an admin in one congregation, a member in another, and a treasurer in a third. Switching contexts is one click.",
	},
	{
		question: "Do you support recurring online giving?",
		answer:
			"Not yet. ChurchFlow records giving today — we expect to add card and bank rails later. For now the focus is making the record-keeping experience exceptional.",
	},
	{
		question: "How do I get started?",
		answer:
			"Click \"Get started,\" sign in with Google, and we'll provision your church on the spot. You can invite teammates the moment you're in.",
	},
];

export const LandingFaq = () => {
	const [open, setOpen] = useState<number | null>(0);

	return (
		<section
			id="faq"
			className="relative scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24 lg:px-10"
		>
			<div className="mx-auto max-w-3xl">
				<div className="text-center">
					<div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-secondary-foreground">
						FAQ
					</div>
					<h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
						Questions, answered honestly.
					</h2>
				</div>

				<div className="mt-12 flex flex-col gap-3">
					{FAQS.map((faq, i) => (
						<FaqItem
							key={faq.question}
							faq={faq}
							isOpen={open === i}
							onToggle={() => setOpen(open === i ? null : i)}
						/>
					))}
				</div>
			</div>
		</section>
	);
};

const FaqItem = ({
	faq,
	isOpen,
	onToggle,
}: {
	faq: Faq;
	isOpen: boolean;
	onToggle: () => void;
}) => {
	return (
		<div
			className={cn(
				"overflow-hidden rounded-2xl border border-border/40 bg-card transition-all duration-300",
				isOpen && "border-border/70 shadow-card",
			)}
		>
			<Button
				type="button"
				variant="ghost"
				aria-expanded={isOpen}
				onClick={onToggle}
				className="flex h-auto w-full cursor-pointer items-center justify-start gap-4 rounded-none border-0 bg-transparent px-5 py-4 text-left font-normal shadow-none transition-colors hover:bg-muted/50"
			>
				<span className="flex-1 text-base font-medium text-foreground">
					{faq.question}
				</span>
				<Icon
					name="chevronDown"
					size={18}
					className={cn(
						"shrink-0 text-muted-foreground transition-transform duration-300",
						isOpen && "rotate-180 text-primary",
					)}
				/>
			</Button>
			<div
				className={cn(
					"grid transition-[grid-template-rows] duration-300 ease-out",
					isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
				)}
			>
				<div className="overflow-hidden">
					<p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
						{faq.answer}
					</p>
				</div>
			</div>
		</div>
	);
};
