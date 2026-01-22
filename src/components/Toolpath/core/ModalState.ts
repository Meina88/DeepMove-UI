import { Point3D } from "../types/toolpath.types"

/**
 * Estado modal CNC completo
 * No contiene lógica, solo estado persistente
 */
export interface ModalState {
  /** Movimiento activo */
  motion: "G0" | "G1" | "G2" | "G3"

  /** Plano activo */
  plane: "G17" | "G18" | "G19"

  /** Unidades */
  units: "mm" | "inch"

  /** Modo de distancia */
  distance: "absolute" | "incremental"

  /**
   * Offset G92 acumulado
   * visualPos = machinePos + g92Offset
   */
  g92Offset: Point3D
}
