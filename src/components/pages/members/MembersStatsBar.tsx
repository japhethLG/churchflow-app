"use client";

export const MembersStatsBar = ({
  total,
  active,
  unregistered,
}: {
  total: number;
  active: number;
  unregistered: number;
}) => {
  return (
    <div className="flex gap-8 px-6 pb-5 pt-2 text-[13px] text-secondary-foreground">
      <span>
        <strong className="font-bold text-foreground">{total}</strong> total
      </span>
      <span>
        <strong className="font-bold text-foreground">{active}</strong> active
      </span>
      <span>
        <strong className="font-bold text-foreground">{unregistered}</strong> unregistered (temp)
      </span>
    </div>
  );
};
