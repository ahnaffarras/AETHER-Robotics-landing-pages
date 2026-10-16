import * as THREE from 'three'

/**
 * Mutable bridge between the native DOM scroll container and the R3F scene.
 * Read in rAF / useFrame loops; never triggers React renders.
 */
export const scrollState: { offset: number; el: HTMLElement | null } = {
  offset: 0,
  el: null,
}

/** Damps `scrollState.offset` toward the container's real scroll progress. Call once per frame. */
export function syncScroll(delta: number) {
  const el = scrollState.el
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  const target = max > 0 ? THREE.MathUtils.clamp(el.scrollTop / max, 0, 1) : 0
  scrollState.offset = THREE.MathUtils.damp(scrollState.offset, target, 6, Math.min(delta, 0.1))
  if (Math.abs(scrollState.offset - target) < 1e-5) scrollState.offset = target
}

export function scrollToOffset(offset: number) {
  const el = scrollState.el
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  el.scrollTo({ top: offset * max, behavior: 'smooth' })
}
