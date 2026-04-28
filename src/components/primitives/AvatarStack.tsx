import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

export const AvatarStack = ({
  members,
  count,
  size = 26,
  max = 3,
  className,
}: {
  members: Array<{ displayName: string; photoUrl: string | null }>;
  count?: number;
  size?: number;
  max?: number;
  className?: string;
}) => {
  const visibleAdmins = members.slice(0, max);
  const totalCount = count ?? members.length;

  return (
    <div className={cn("inline-flex items-center", className)}>
      <div className="inline-flex items-center -space-x-2">
        {visibleAdmins.map((member, i) => (
          <div
            key={i}
            className="relative shrink-0 rounded-full border-2 border-card overflow-hidden"
          >
            <Avatar 
              name={member.displayName} 
              src={member.photoUrl ?? undefined} 
              size={size} 
            />
          </div>
        ))}
      </div>
      {totalCount > 0 && (
        <span className="ml-2 text-xs text-muted-foreground whitespace-nowrap">
          {totalCount} {totalCount === 1 ? "admin" : "admins"}
        </span>
      )}
      {totalCount === 0 && (
        <span className="text-xs text-muted-foreground">No admins yet</span>
      )}
    </div>
  );
};
