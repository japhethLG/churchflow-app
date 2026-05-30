"use client";

import Image from "next/image";
import { useState } from "react";
import { AvatarFallback, Avatar as ShadedAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export const Avatar = ({
	name = "",
	size = 36,
	src,
	color,
	className,
}: {
	name?: string;
	size?: number;
	src?: string;
	color?: string;
	className?: string;
}) => {
	// Remote photos go through next/image (resized + WebP/AVIF, served from
	// the same-origin /_next/image SWR cache) instead of a raw cross-origin
	// <img>. On load failure we fall back to the initials, same as before.
	const [imageFailed, setImageFailed] = useState(false);

	const initials = name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();

	const palette = [
		"#4F46E5",
		"#7E3000",
		"#0D9488",
		"#9333EA",
		"#2563EB",
		"#16A34A",
		"#D97706",
	];
	const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
	const bg = color || palette[hash % palette.length];

	const showImage = Boolean(src) && !imageFailed;

	return (
		<ShadedAvatar
			style={{ width: size, height: size }}
			className={cn("shrink-0", className)}
		>
			{showImage && (
				<Image
					src={src as string}
					alt={name}
					fill
					sizes={`${size}px`}
					className="z-[1] rounded-full object-cover"
					onError={() => setImageFailed(true)}
				/>
			)}
			<AvatarFallback
				style={{ color: bg, backgroundColor: `${bg}22` }}
				className="font-semibold tracking-tighter"
			>
				{initials}
			</AvatarFallback>
		</ShadedAvatar>
	);
};
