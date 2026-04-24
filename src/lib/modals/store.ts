"use client";

import { create } from "zustand";
import type { ModalName, ModalPropsMap } from "./registry";

type ActiveModal = {
  [K in ModalName]: { name: K; props: ModalPropsMap[K] };
}[ModalName];

type ModalStore = {
  active: ActiveModal | null;
  open: <K extends ModalName>(name: K, props: ModalPropsMap[K]) => void;
  close: () => void;
};

export const useModalStore = create<ModalStore>((set) => ({
  active: null,
  open: (name, props) =>
    set({ active: { name, props } as ActiveModal }),
  close: () => set({ active: null }),
}));

export const openModal = <K extends ModalName>(
  name: K,
  props: ModalPropsMap[K]
): void => useModalStore.getState().open(name, props);

export const closeModal = (): void => useModalStore.getState().close();
