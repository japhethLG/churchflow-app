"use client";

import type { ComponentType } from "react";
import { useModalStore } from "./store";
import type { ModalBaseProps, ModalName } from "./registry";
// Importing the modals barrel loads every modal's `declare module`
// augmentation so ModalPropsMap is fully populated here.
import "@/components/modals";
import { ConfirmDeleteModal } from "@/components/modals/confirm-delete";

// Name → component lookup. Every entry in this map must correspond to a
// key on ModalPropsMap (enforced by the `Partial<Record<ModalName, ...>>`
// type). Adding a new modal = one line here + the modal's folder.
const registry: Partial<
  Record<ModalName, ComponentType<ModalBaseProps & Record<string, unknown>>>
> = {
  "confirm-delete": ConfirmDeleteModal as ComponentType<
    ModalBaseProps & Record<string, unknown>
  >,
};

export function ModalHost() {
  const { active, close } = useModalStore();
  if (!active) return null;
  const { name, props } = active as {
    name: ModalName;
    props: Record<string, unknown>;
  };
  const Comp = registry[name];
  if (!Comp) return null;
  return <Comp {...props} onClose={close} />;
}
