export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const range = (o: number, a: number, b: number) => clamp01((o - a) / (b - a))
export const smooth = (t: number) => t * t * (3 - 2 * t)
export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

export const PHASES = [
  { id: 'bench', index: '01', label: 'Bench', start: 0, focus: 0 },
  { id: 'isolation', index: '02', label: 'Isolation', start: 0.2, focus: 0.3 },
  { id: 'architecture', index: '03', label: 'Architecture', start: 0.4, focus: 0.54 },
  { id: 'telemetry', index: '04', label: 'Telemetry', start: 0.65, focus: 0.77 },
  { id: 'specs', index: '05', label: 'Spec Sheet', start: 0.85, focus: 1 },
] as const

export function phaseIndexAt(offset: number) {
  let idx = 0
  PHASES.forEach((p, i) => {
    if (offset >= p.start - 0.001) idx = i
  })
  return idx
}

/**
 * Single source of truth for every scroll-driven value in the scene.
 * Pure + cheap so each consumer can evaluate it inside its own useFrame.
 */
export function getStage(o: number) {
  const bench = 1 - smooth(range(o, 0.16, 0.32))
  const lift = easeInOutCubic(range(o, 0.17, 0.4))
  const explodeIn = easeInOutCubic(range(o, 0.42, 0.58))
  const reassemble = easeOutExpo(range(o, 0.65, 0.71))
  const explode = explodeIn * (1 - reassemble)
  const annotate = smooth(range(o, 0.5, 0.55)) * (1 - smooth(range(o, 0.61, 0.65)))
  const telemetry = smooth(range(o, 0.68, 0.74)) * (1 - smooth(range(o, 0.87, 0.93)))
  const dock = easeInOutCubic(range(o, 0.85, 1))
  return { bench, lift, explode, annotate, telemetry, dock }
}

export type Stage = ReturnType<typeof getStage>
