"use client";

import { Amount } from "@/components/primitives";

export const PledgesStatsBar = ({
  total,
  active,
  fulfilled,
  totalAmount,
}: {
  total: number;
  active: number;
  fulfilled: number;
  totalAmount: number;
}) => {
  return (
    <div className="flex gap-8 px-6 pb-5 pt-2 text-[13px] text-secondary-foreground">
      <span>
        <strong className="font-bold text-foreground">{total}</strong> pledges
      </span>
      <span>
        <strong className="font-bold text-foreground">{active}</strong> active
      </span>
      <span>
        <strong className="font-bold text-foreground">{fulfilled}</strong> fulfilled
      </span>
      <span>
        <strong className="font-bold text-foreground">
          <Amount value={totalAmount.toString()} />
        </strong>{" "}
        committed
      </span>
    </div>
  );
};
