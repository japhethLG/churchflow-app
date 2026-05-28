// Sheet props are registered by augmenting this interface from each sheet
// file:
//
//   declare module "@/lib/sheets/registry" {
//     interface SheetPropsMap {
//       account: { perspective: Perspective };
//     }
//   }
//
// Once augmented, openSheet("account", { perspective }) is fully type-checked.

// biome-ignore lint/suspicious/noEmptyInterface: Intentional empty interface for module augmentation
export interface SheetPropsMap {}

export type SheetName = keyof SheetPropsMap;

// Host injects these into every sheet component. Sheet authors thread them
// through to <BaseSheet>; openSheet() callers don't pass them.
export type SheetBaseProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onOpenChangeComplete: (open: boolean) => void;
};
