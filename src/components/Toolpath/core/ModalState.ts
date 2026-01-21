export interface ModalState {
  motion: "G0" | "G1" | "G2" | "G3"
  plane: "G17" | "G18" | "G19"
  units: "mm" | "inch"
  distance: "absolute" | "incremental"
}
