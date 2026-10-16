'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { smooth } from '@/lib/choreography'
import { scrollState, syncScroll } from '@/lib/scroll-store'

type Key = { t: number; pos: [number, number, number]; target: [number, number, number]; fov: number }

/** Camera keyframes along scroll progress. `wide` = landscape, `tall` = portrait. */
function keyframes(wide: boolean): Key[] {
  const dockTargetX = wide ? 1.25 : 0
  return [
    { t: 0, pos: [4.6, 6.4, 6.6], target: wide ? [-0.9, -0.2, 0.9] : [0, -0.3, 0.9], fov: 30 },
    { t: 0.16, pos: [4.4, 5.8, 6.2], target: wide ? [-0.7, 0, 0.6] : [0, -0.1, 0.6], fov: 30 },
    { t: 0.4, pos: [2.2, 2.05, 3.1], target: wide ? [-0.55, 1.15, -0.05] : [0.1, 1.05, 0], fov: 30 },
    { t: 0.52, pos: [5.6, 3.5, 6.8], target: wide ? [-0.3, 1.45, 0] : [0, 1.5, 0], fov: 34 },
    { t: 0.64, pos: [5.2, 3.1, 6.2], target: wide ? [-0.3, 1.45, 0] : [0, 1.5, 0], fov: 34 },
    { t: 0.75, pos: [-0.6, 6.6, 5.4], target: wide ? [0.9, 1.0, 0.3] : [0, 0.8, 0.6], fov: 30 },
    { t: 0.86, pos: [-0.4, 6.8, 5.0], target: wide ? [0.9, 1.0, 0.3] : [0, 0.8, 0.6], fov: 30 },
    { t: 1, pos: [dockTargetX, 28, 7.5], target: [dockTargetX, 1.1, 0], fov: 12 },
  ]
}

const tmpPos = new THREE.Vector3()
const tmpTarget = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()

export function CameraRig() {
  const look = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const parallax = useMemo(() => new THREE.Vector2(), [])

  useFrame((state, delta) => {
    syncScroll(delta)
    const o = scrollState.offset

    const wide = state.size.width > state.size.height
    const keys = keyframes(wide)
    let i = 0
    while (i < keys.length - 2 && o > keys[i + 1].t) i++
    const k0 = keys[i]
    const k1 = keys[i + 1]
    const local = smooth(THREE.MathUtils.clamp((o - k0.t) / (k1.t - k0.t), 0, 1))

    tmpPos.lerpVectors(a.fromArray(k0.pos), b.fromArray(k1.pos), local)
    tmpTarget.lerpVectors(a.fromArray(k0.target), b.fromArray(k1.target), local)
    const fov = THREE.MathUtils.lerp(k0.fov, k1.fov, local)

    // Portrait screens need more distance to fit the 4.2-unit wide board.
    const aspect = state.size.width / state.size.height
    const fit = aspect < 1 ? THREE.MathUtils.clamp(1 / aspect, 1, 2.1) * 0.95 : 1
    tmpPos.sub(tmpTarget).multiplyScalar(fit).add(tmpTarget)

    // Subtle mouse parallax, fades out as the spec sheet takes over.
    const dockFade = 1 - smooth(THREE.MathUtils.clamp((o - 0.85) / 0.15, 0, 1))
    parallax.x = THREE.MathUtils.damp(parallax.x, state.pointer.x, 3, delta)
    parallax.y = THREE.MathUtils.damp(parallax.y, state.pointer.y, 3, delta)
    tmpPos.x += parallax.x * 0.45 * dockFade
    tmpPos.y += parallax.y * 0.3 * dockFade

    const cam = state.camera as THREE.PerspectiveCamera
    cam.position.x = THREE.MathUtils.damp(cam.position.x, tmpPos.x, 5, delta)
    cam.position.y = THREE.MathUtils.damp(cam.position.y, tmpPos.y, 5, delta)
    cam.position.z = THREE.MathUtils.damp(cam.position.z, tmpPos.z, 5, delta)
    look.x = THREE.MathUtils.damp(look.x, tmpTarget.x, 5, delta)
    look.y = THREE.MathUtils.damp(look.y, tmpTarget.y, 5, delta)
    look.z = THREE.MathUtils.damp(look.z, tmpTarget.z, 5, delta)
    cam.lookAt(look)
    const nextFov = THREE.MathUtils.damp(cam.fov, fov, 5, delta)
    if (Math.abs(nextFov - cam.fov) > 1e-4) {
      cam.fov = nextFov
      cam.updateProjectionMatrix()
    }
  })

  return null
}
