"use client";

import { create } from "zustand";
import type { SheetName, SheetPropsMap } from "./registry";

type ActiveSheet = {
	[K in SheetName]: { name: K; props: SheetPropsMap[K] };
}[SheetName];

type SheetStore = {
	active: ActiveSheet | null;
	open: <K extends SheetName>(name: K, props: SheetPropsMap[K]) => void;
	close: () => void;
};

export const useSheetStore = create<SheetStore>((set) => ({
	active: null,
	open: (name, props) => set({ active: { name, props } as ActiveSheet }),
	close: () => set({ active: null }),
}));

export const openSheet = <K extends SheetName>(
	name: K,
	props: SheetPropsMap[K],
): void => useSheetStore.getState().open(name, props);

export const closeSheet = (): void => useSheetStore.getState().close();
