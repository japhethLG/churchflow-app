// Modal props are registered by augmenting this interface from each modal file:
//
//   declare module "@/lib/modals/registry" {
//     interface ModalPropsMap {
//       "my-modal": { id: string };
//     }
//   }
//
// Once augmented, open("my-modal", { id }) is fully type-checked.

export interface ModalPropsMap {}

export type ModalName = keyof ModalPropsMap;

export type ModalBaseProps = {
  onClose: () => void;
};
