"use client";

import dynamic from "next/dynamic";
import { type ComponentType, useEffect, useState } from "react";
import type { SheetBaseProps, SheetName } from "./registry";
import { useSheetStore } from "./store";

type AnySheet = ComponentType<SheetBaseProps & Record<string, unknown>>;

// Code-split each sheet; only fetched when first opened. The `declare
// module` augmentations populating SheetPropsMap are applied by the
// compiler from src/** (tsconfig `include`), so no barrel side-effect
// import is needed for type safety.
const lazySheet = (
	loader: () => Promise<Record<string, unknown>>,
	exportName: string,
): AnySheet =>
	dynamic(() => loader().then((mod) => mod[exportName] as AnySheet), {
		ssr: false,
	}) as AnySheet;

const registry: Partial<Record<SheetName, AnySheet>> = {
	account: lazySheet(
		() => import("@/components/sheets/account"),
		"AccountSheet",
	),
	more: lazySheet(() => import("@/components/sheets/more"), "MoreSheet"),
	pledge: lazySheet(() => import("@/components/sheets/pledge"), "PledgeSheet"),
	"record-gift": lazySheet(
		() => import("@/components/sheets/record-gift"),
		"RecordGiftSheet",
	),
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
