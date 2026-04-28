"use client";

export const CampaignsStatsBar = ({
  total,
  active,
  draft,
  completed,
}: {
  total: number;
  active: number;
  draft: number;
  completed: number;
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
        <strong className="font-bold text-foreground">{draft}</strong> draft
      </span>
      <span>
        <strong className="font-bold text-foreground">{completed}</strong> completed
      </span>
    </div>
  );
};
