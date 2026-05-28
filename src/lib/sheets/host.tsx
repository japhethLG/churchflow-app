"use client";

import { type ComponentType, useEffect, useState } from "react";
import type { SheetBaseProps, SheetName } from "./registry";
import { useSheetStore } from "./store";
// Importing the sheets barrel loads every sheet's `declare module`
// augmentation so SheetPropsMap is fully populated here.
import "@/components/sheets";
import { AccountSheet } from "@/components/sheets/account";
import { MoreSheet } from "@/components/sheets/more";
import { RecordGiftSheet } from "@/components/sheets/record-gift";

type AnySheet = ComponentType<SheetBaseProps & Record<string, unknown>>;

const registry: Partial<Record<SheetName, AnySheet>> = {
	account: AccountSheet as AnySheet,
	more: MoreSheet as AnySheet,
	"record-gift": RecordGiftSheet as AnySheet,
};

/**
 * Hosts the active sheet. Unlike `ModalHost`, sheets have an exit
 * animation (slide-out + scrim fade), so the host keeps the component
 * mounted after `active` goes null until `onOpenChangeComplete` fires.
 */
export const SheetHost = () => {
	const { active, close } = useSheetStore();
	// Mirror of `active` that survives across the close animation so the
	// sheet can play its exit transition before unmounting.
	const [rendered, setRendered] = useState<typeof active>(null);

	useEffect(() => {
		if (active) {
			setRendered(active);
		}
	}, [active]);

	const open = active !== null;

	if (!rendered) {
		return null;
	}
	const Comp = registry[rendered.name];
	if (!Comp) {
		return null;
	}

	const { props } = rendered as {
		name: SheetName;
		props: Record<string, unknown>;
	};

	return (
		<Comp
			{...props}
			open={open}
			onOpenChange={(next) => {
				if (!next) {
					close();
				}
			}}
			onOpenChangeComplete={(isOpen) => {
				if (!isOpen) {
					setRendered(null);
				}
			}}
		/>
	);
};
