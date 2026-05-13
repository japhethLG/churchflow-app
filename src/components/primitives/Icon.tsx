import * as Lucide from "lucide-react";
import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export type IconName =
	| "home"
	| "users"
	| "user"
	| "calendar"
	| "receipt"
	| "chart"
	| "mail"
	| "settings"
	| "search"
	| "bell"
	| "plus"
	| "check"
	| "x"
	| "chevronDown"
	| "chevronRight"
	| "chevronLeft"
	| "pin"
	| "dots"
	| "filter"
	| "cash"
	| "check_rect"
	| "bank"
	| "phone"
	| "google"
	| "book"
	| "location"
	| "link"
	| "edit"
	| "trash"
	| "arrowRight"
	| "arrowUp"
	| "download"
	| "logo"
	| "logout"
	| "clock"
	| "close"
	| "moreHorizontal"
	| "slash"
	| "info"
	| "circleCheck"
	| "triangleAlert"
	| "octagonX"
	| "loader"
	| "menu"
	| "sparkles"
	| "shield"
	| "heart"
	| "trending"
	| "globe"
	| "lock"
	| "gift"
	| "brush"
	| "eraser"

const LUCIDE_MAP: Record<
	Exclude<IconName, "google" | "logo">,
	Lucide.LucideIcon
> = {
	home: Lucide.Home,
	users: Lucide.Users,
	user: Lucide.User,
	calendar: Lucide.Calendar,
	receipt: Lucide.Receipt,
	chart: Lucide.BarChart3,
	mail: Lucide.Mail,
	settings: Lucide.Settings,
	search: Lucide.Search,
	bell: Lucide.Bell,
	plus: Lucide.Plus,
	check: Lucide.Check,
	x: Lucide.X,
	chevronDown: Lucide.ChevronDown,
	chevronRight: Lucide.ChevronRight,
	chevronLeft: Lucide.ChevronLeft,
	pin: Lucide.MapPin,
	dots: Lucide.MoreVertical,
	filter: Lucide.Filter,
	cash: Lucide.Banknote,
	check_rect: Lucide.FileText,
	bank: Lucide.Building2,
	phone: Lucide.Smartphone,
	book: Lucide.Book,
	location: Lucide.MapPin,
	link: Lucide.Link,
	edit: Lucide.Edit2,
	trash: Lucide.Trash2,
	arrowRight: Lucide.ArrowRight,
	arrowUp: Lucide.ArrowUp,
	download: Lucide.Download,
	logout: Lucide.LogOut,
	clock: Lucide.Clock,
	close: Lucide.X,
	moreHorizontal: Lucide.MoreHorizontal,
	slash: Lucide.Slash,
	info: Lucide.Info,
	circleCheck: Lucide.CircleCheck,
	triangleAlert: Lucide.TriangleAlert,
	octagonX: Lucide.OctagonX,
	loader: Lucide.Loader2,
	menu: Lucide.Menu,
	sparkles: Lucide.Sparkles,
	shield: Lucide.ShieldCheck,
	heart: Lucide.HeartHandshake,
	trending: Lucide.TrendingUp,
	globe: Lucide.Globe,
	lock: Lucide.Lock,
	gift: Lucide.Gift,
	brush: Lucide.Brush,
	eraser: Lucide.Eraser,
};

type IconProps = {
	name: IconName;
	size?: number;
	color?: string;
	strokeWidth?: number;
} & Omit<SVGProps<SVGSVGElement>, "name" | "size" | "color">;

export const Icon = ({
	name,
	size = 20,
	color = "currentColor",
	strokeWidth = 2,
	className,
	...rest
}: IconProps) => {
	if (name === "google") {
		return (
			<svg
				width={size}
				height={size}
				viewBox="0 0 24 24"
				className={cn("shrink-0", className)}
				aria-hidden="true"
				{...rest}
			>
				<path
					d="M21.35 11.1h-9.17v2.96h5.24c-.22 1.18-.88 2.18-1.87 2.85v2.37h3.02c1.77-1.63 2.78-4.03 2.78-6.87 0-.56-.05-1.1-.14-1.61z"
					fill="#4285F4"
				/>
				<path
					d="M12.18 21c2.52 0 4.64-.83 6.18-2.26l-3.02-2.37c-.84.56-1.91.9-3.16.9-2.43 0-4.49-1.64-5.22-3.85H3.84v2.42C5.38 18.9 8.55 21 12.18 21z"
					fill="#34A853"
				/>
				<path
					d="M6.96 13.42a5.4 5.4 0 0 1 0-3.44V7.56H3.84a8.99 8.99 0 0 0 0 8.28z"
					fill="#FBBC05"
				/>
				<path
					d="M12.18 6.13c1.37 0 2.6.47 3.57 1.4l2.67-2.67C16.81 3.47 14.7 2.6 12.18 2.6c-3.63 0-6.8 2.1-8.34 5.16l3.12 2.42c.73-2.21 2.79-3.85 5.22-3.85z"
					fill="#EA4335"
				/>
			</svg>
		);
	}

	if (name === "logo") {
		const Church = Lucide.Church;
		return (
			<Church
				size={size}
				color={color}
				strokeWidth={strokeWidth}
				className={cn("shrink-0", className)}
				{...rest}
			/>
		);
	}

	const LucideIcon = LUCIDE_MAP[name];
	if (!LucideIcon) {
		return null;
	}

	return (
		<LucideIcon
			size={size}
			color={color}
			strokeWidth={strokeWidth}
			className={cn("shrink-0", className)}
			{...rest}
		/>
	);
};
