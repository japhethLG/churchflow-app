import { Avatar as ShadedAvatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
    
  const palette = ["#4F46E5", "#7E3000", "#0D9488", "#9333EA", "#2563EB", "#16A34A", "#D97706"];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const bg = color || palette[hash % palette.length];

  return (
    <ShadedAvatar 
      style={{ width: size, height: size }}
      className={cn("shrink-0", className)}
    >
      {src && <AvatarImage src={src} alt={name} className="object-cover" />}
      <AvatarFallback 
        style={{ color: bg, backgroundColor: `${bg}22` }}
        className="font-semibold tracking-tighter"
      >
        {initials}
      </AvatarFallback>
    </ShadedAvatar>
  );
}
