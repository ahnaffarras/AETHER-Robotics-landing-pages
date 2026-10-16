'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { getStage } from '@/lib/choreography'
import { scrollState } from '@/lib/scroll-store'

type Vec3 = [number, number, number]

const projected = new THREE.Vector3()
const worldEnd = new THREE.Vector3()

function createLabel(code: string, title: string, detail: string, side: 'left' | 'right') {
  const root = document.createElement('div')
  root.setAttribute('aria-hidden', 'true')
  root.className = `pointer-events-none absolute top-0 left-0 z-10 w-max opacity-0 will-change-transform ${
    side === 'right' ? '' : 'text-right'
  }`
  const lines: [string, string][] = [
    ['font-mono text-[10px] tracking-[0.2em] text-signal uppercase', code],
    ['mt-1 text-sm font-medium text-neutral-100 md:text-base', title],
    ['mt-0.5 max-w-[14rem] text-xs leading-relaxed text-neutral-400', detail],
  ]
  for (const [cls, text] of lines) {
    const p = document.createElement('p')
    p.className = cls
    p.textContent = text
    root.appendChild(p)
  }
  return root
}

/**
 * Leader line + label. The label is a plain DOM node projected every frame,
 * avoiding drei <Html>, whose nested React root races with Suspense under React 19.
 */
export function Annotation({
  anchor,
  elbow,
  end,
  code,
  title,
  detail,
  side = 'right',
  delay = 0,
}: {
  anchor: Vec3
  elbow: Vec3
  end: Vec3
  code: string
  title: string
  detail: string
  side?: 'left' | 'right'
  delay?: number
}) {
  const gl = useThree((s) => s.gl)
  const group = useRef<THREE.Group>(null)
  const label = useRef<HTMLDivElement | null>(null)
  const line = useRef<{ material: THREE.Material & { opacity: number } } | null>(null)
  const dot = useRef<THREE.MeshBasicMaterial>(null)
  const points = useMemo(() => [anchor, elbow, end], [anchor, elbow, end])

  useEffect(() => {
    const host = gl.domElement.parentElement
    if (!host) return
    const el = createLabel(code, title, detail, side)
    host.appendChild(el)
    label.current = el
    return () => {
      el.remove()
      label.current = null
    }
  }, [gl, code, title, detail, side])

  useFrame((state) => {
    const s = getStage(scrollState.offset)
    const a = THREE.MathUtils.clamp(s.annotate * 1.4 - delay, 0, 1)
    if (line.current) line.current.material.opacity = a
    if (dot.current) dot.current.opacity = a

    const el = label.current
    if (!el || !group.current) return
    el.style.opacity = String(a)
    if (a <= 0) return
    worldEnd.fromArray(end)
    group.current.localToWorld(worldEnd)
    projected.copy(worldEnd).project(state.camera)
    const x = (projected.x * 0.5 + 0.5) * state.size.width
    const y = (-projected.y * 0.5 + 0.5) * state.size.height
    const slide = side === 'right' ? (1 - a) * -12 : (1 - a) * 12
    const shiftX = side === 'right' ? '12px' : 'calc(-100% - 12px)'
    el.style.transform = `translate3d(${x + slide}px, ${y}px, 0) translate(${shiftX}, -50%)`
  })

  return (
    <group ref={group}>
      <Line
        ref={line as never}
        points={points}
        color="#6ee7f9"
        lineWidth={1}
        transparent
        opacity={0}
        depthTest={false}
        renderOrder={10}
      />
      <mesh position={anchor} renderOrder={10}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial ref={dot} color="#6ee7f9" transparent opacity={0} depthTest={false} toneMapped={false} />
      </mesh>
    </group>
  )
}
