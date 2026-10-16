'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createBrushedTexture, createFR4Texture, createLabelTexture } from '@/lib/procedural-textures'

let cache: ReturnType<typeof buildMaterials> | null = null

function buildMaterials() {
  const brushed = createBrushedTexture()
  brushed.repeat.set(1, 4)
  return {
    fr4: new THREE.MeshStandardMaterial({ map: createFR4Texture(), roughness: 0.62, metalness: 0.15 }),
    copper: new THREE.MeshStandardMaterial({ color: '#c47f45', metalness: 1, roughness: 0.28 }),
    gold: new THREE.MeshStandardMaterial({ color: '#e0b25a', metalness: 1, roughness: 0.22 }),
    pin: new THREE.MeshStandardMaterial({ color: '#d5d7da', metalness: 1, roughness: 0.25 }),
    epoxy: new THREE.MeshStandardMaterial({ color: '#111214', metalness: 0.15, roughness: 0.42 }),
    package: new THREE.MeshStandardMaterial({ color: '#1b2a22', metalness: 0.2, roughness: 0.5 }),
    nickel: new THREE.MeshStandardMaterial({ color: '#7d8187', metalness: 1, roughness: 0.48 }),
    steel: new THREE.MeshStandardMaterial({ color: '#6f7379', metalness: 1, roughness: 0.5 }),
    anodized: new THREE.MeshStandardMaterial({
      color: '#3a3f46',
      metalness: 0.88,
      roughness: 0.5,
      roughnessMap: brushed,
      emissive: new THREE.Color('#ff5a1f'),
      emissiveIntensity: 0,
    }),
    plastic: new THREE.MeshStandardMaterial({ color: '#0e0e10', metalness: 0, roughness: 0.7 }),
    ivory: new THREE.MeshStandardMaterial({ color: '#d9d4c7', metalness: 0, roughness: 0.6 }),
    green: new THREE.MeshStandardMaterial({ color: '#2f6b44', metalness: 0, roughness: 0.55 }),
    hole: new THREE.MeshBasicMaterial({ color: '#020202' }),
    smd: new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.1, roughness: 0.5 }),
    ledGreen: new THREE.MeshBasicMaterial({ color: '#4ade80', toneMapped: false }),
    ledAmber: new THREE.MeshBasicMaterial({ color: '#fbbf24', toneMapped: false }),
  }
}

export function getMaterials() {
  if (!cache) cache = buildMaterials()
  return cache
}

const unitBox = new THREE.BoxGeometry(1, 1, 1)

export type BoxItem = { p: [number, number, number]; s: [number, number, number]; ry?: number; color?: string }

export function InstancedBoxes({ items, material }: { items: BoxItem[]; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      q.setFromEuler(e.set(0, it.ry ?? 0, 0))
      m.compose(new THREE.Vector3(...it.p), q, new THREE.Vector3(...it.s))
      mesh.setMatrixAt(i, m)
      if (it.color) mesh.setColorAt(i, c.set(it.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [items])
  return <instancedMesh ref={ref} args={[unitBox, material, items.length]} />
}

export function Label({
  lines,
  w,
  d,
  position,
  rotationY = 0,
  color = '#7d8288',
  opacity = 1,
}: {
  lines: string[]
  w: number
  d: number
  position: [number, number, number]
  rotationY?: number
  color?: string
  opacity?: number
}) {
  const texture = useMemo(() => {
    const ratio = w / d
    return createLabelTexture(lines, { width: Math.round(128 * ratio) * 2, height: 256, color })
  }, [lines, w, d, color])
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotationY]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={opacity}
        roughness={0.55}
        metalness={0.2}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )
}

/** Gull-wing / QFN pins around a rectangular body. */
export function perimeterPins(
  w: number,
  d: number,
  perSide: number,
  y: number,
  kind: 'qfp' | 'qfn',
): BoxItem[] {
  const items: BoxItem[] = []
  const len = kind === 'qfp' ? 0.07 : 0.03
  const t = kind === 'qfp' ? 0.012 : 0.008
  const pw = Math.min(w, d) / (perSide * 2.2)
  for (let i = 0; i < perSide; i++) {
    const f = (i + 0.5) / perSide - 0.5
    items.push({ p: [f * w * 0.85, y, -d / 2 - len / 2 + 0.01], s: [pw, t, len] })
    items.push({ p: [f * w * 0.85, y, d / 2 + len / 2 - 0.01], s: [pw, t, len] })
    items.push({ p: [-w / 2 - len / 2 + 0.01, y, f * d * 0.85], s: [len, t, pw] })
    items.push({ p: [w / 2 + len / 2 - 0.01, y, f * d * 0.85], s: [len, t, pw] })
  }
  return items
}
