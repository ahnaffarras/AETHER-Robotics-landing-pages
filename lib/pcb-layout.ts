import { mulberry32 } from './procedural-textures'

export const BOARD = { w: 4.2, d: 3.0, h: 0.06 }
export const TOP = BOARD.h / 2

export type ChipSpec = {
  id: string
  x: number
  z: number
  w: number
  d: number
  h: number
  pins: 'qfp' | 'qfn' | 'none'
  pinsPerSide: number
  label: string[]
}

export const NPU = { x: -0.2, z: 0, size: 1.2, lid: 0.82 }

export const CHIPS: ChipSpec[] = [
  { id: 'mem-a', x: 0.95, z: -0.5, w: 0.46, d: 0.32, h: 0.05, pins: 'none', pinsPerSide: 0, label: ['LPDDR5', '8GB'] },
  { id: 'mem-b', x: 0.95, z: 0.45, w: 0.46, d: 0.32, h: 0.05, pins: 'none', pinsPerSide: 0, label: ['LPDDR5', '8GB'] },
  { id: 'imu', x: -1.45, z: -0.95, w: 0.28, d: 0.28, h: 0.04, pins: 'qfn', pinsPerSide: 5, label: ['IMU-6A'] },
  { id: 'pmic', x: -1.2, z: -0.25, w: 0.4, d: 0.4, h: 0.045, pins: 'qfp', pinsPerSide: 8, label: ['PMIC', 'AX-P2'] },
  { id: 'drv-a', x: 1.6, z: -0.95, w: 0.4, d: 0.4, h: 0.045, pins: 'qfp', pinsPerSide: 8, label: ['DRV-48', 'CH.A'] },
  { id: 'drv-b', x: 1.6, z: -0.3, w: 0.4, d: 0.4, h: 0.045, pins: 'qfp', pinsPerSide: 8, label: ['DRV-48', 'CH.B'] },
  { id: 'mcu', x: -0.6, z: -1.0, w: 0.3, d: 0.3, h: 0.04, pins: 'qfn', pinsPerSide: 6, label: ['R52', 'RT'] },
]

/** Footprints (x, z, halfW, halfD) that SMDs and vias must avoid. */
export const KEEP_OUT: [number, number, number, number][] = [
  [NPU.x, NPU.z, 0.68, 0.68],
  ...CHIPS.map((c) => [c.x, c.z, c.w / 2 + 0.1, c.d / 2 + 0.1] as [number, number, number, number]),
  [-1.85, 0.57, 0.42, 0.62],
  [1.95, 0.85, 0.22, 0.45],
  [0.35, 1.33, 0.45, 0.2],
  [-0.25, -1.33, 1.05, 0.15],
  [-1.2, 0.32, 0.2, 0.2],
  [-1.2, 0.78, 0.2, 0.2],
  [0.95, 1.15, 0.22, 0.22],
  [1.35, 1.15, 0.22, 0.22],
  [-1.95, -1.3, 0.14, 0.14],
  [1.95, -1.3, 0.14, 0.14],
  [-1.95, 1.3, 0.14, 0.14],
  [1.95, 1.3, 0.14, 0.14],
]

export function isFree(x: number, z: number, margin = 0) {
  if (Math.abs(x) > BOARD.w / 2 - 0.08 || Math.abs(z) > BOARD.d / 2 - 0.08) return false
  return !KEEP_OUT.some(
    ([cx, cz, hw, hd]) => Math.abs(x - cx) < hw + margin && Math.abs(z - cz) < hd + margin,
  )
}

export function scatter(count: number, seed: number, margin = 0) {
  const rand = mulberry32(seed)
  const pts: [number, number][] = []
  let guard = 0
  while (pts.length < count && guard < count * 50) {
    guard++
    const x = (rand() - 0.5) * BOARD.w
    const z = (rand() - 0.5) * BOARD.d
    if (isFree(x, z, margin)) pts.push([x, z])
  }
  return pts
}

export const HOTSPOTS: [number, number, number, number][] = [
  // x, z, radius, strength
  [NPU.x, NPU.z, 0.95, 1.0],
  [1.6, -0.62, 0.6, 0.85],
  [-1.2, -0.25, 0.45, 0.6],
  [0.95, 0, 0.5, 0.45],
]
