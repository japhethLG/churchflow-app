import Image from "next/image";
import { cn } from "@/lib/utils";
import logoImg from "../../../public/logo.png";

export const Wordmark = ({
	size = "md",
	className,
}: {
	size?: "sm" | "md" | "lg";
	className?: string;
}) => {
	const sizeClasses = {
		sm: "text-xs",
		md: "text-base",
		lg: "text-xl",
	};

	const imageClasses = {
		sm: "size-6",
		md: "size-7",
		lg: "size-8",
	};

	return (
		<div
			className={cn(
				"group flex items-center font-bold tracking-tight text-foreground cursor-pointer",
				sizeClasses[size],
				className,
			)}
		>
			<Image
				src={logoImg}
				alt="ChurchFlow Logo"
				className={cn(
					"shrink-0 m-2 transition-transform duration-500 ease-out group-hover:scale-105",
					imageClasses[size],
				)}
			/>
			<span>
				<span className="text-(--palette-primary-800)">Church</span>
				<span
					className="bg-clip-text text-transparent font-extrabold [background-size:300%_100%] [background-position:0%_50%] group-hover:[background-position:100%_50%] transition-[background-position] duration-700 ease-in-out"
					style={{
						backgroundImage:
							"linear-gradient(110deg, var(--palette-primary-600) 0%, var(--palette-info-400) 25%, var(--palette-primary-200) 50%, var(--palette-primary-300) 75%, var(--palette-primary-500) 100%)",
					}}
				>
					Flow
				</span>
			</span>
		</div>
	);
};
