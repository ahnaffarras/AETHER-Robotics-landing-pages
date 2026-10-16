'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { scrollState } from '@/lib/scroll-store'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { getStage } from '@/lib/choreography'
import { mulberry32 } from '@/lib/procedural-textures'
import { TOP } from '@/lib/pcb-layout'

type P = [number, number]

/** 45° Manhattan route between two board points. */
function route(a: P, b: P): P[] {
  const dx = b[0] - a[0]
  const dz = b[1] - a[1]
  let mid: P
  if (Math.abs(dx) > Math.abs(dz)) mid = [b[0] - Math.sign(dx) * Math.abs(dz), a[1]]
  else mid = [a[0], b[1] - Math.sign(dz) * Math.abs(dx)]
  const pts: P[] = [a]
  if (Math.hypot(mid[0] - a[0], mid[1] - a[1]) > 1e-3) pts.push(mid)
  pts.push(b)
  return pts
}

function bus(a: P, b: P, count: number, spreadA: P, spreadB: P) {
  const routes: P[][] = []
  for (let i = 0; i < count; i++) {
    const k = i - (count - 1) / 2
    routes.push(
      route([a[0] + spreadA[0] * k, a[1] + spreadA[1] * k], [b[0] + spreadB[0] * k, b[1] + spreadB[1] * k]),
    )
  }
  return routes
}

const S = 0.045

const ROUTES: { pts: P[]; r: number }[] = [
  ...bus([0.4, -0.5], [0.72, -0.5], 6, [0, S], [0, S]),
  ...bus([0.4, 0.45], [0.72, 0.45], 6, [0, S], [0, S]),
  ...bus([0.15, -0.6], [1.4, -0.95], 5, [S, 0], [0, S]),
  ...bus([0.4, -0.2], [1.4, -0.3], 4, [0, S], [0, S]),
  ...bus([-0.8, 0.35], [-1.6, 0.6], 5, [0, S], [0, S]),
  ...bus([0.05, 0.6], [0.2, 1.18], 6, [S, 0], [S, 0]),
  ...bus([-0.8, -0.45], [-1.3, -0.95], 3, [0, S], [S, 0]),
  ...bus([1.8, -0.3], [1.85, 0.42], 3, [S, 0], [S, 0]),
  ...bus([-0.55, -1.22], [-0.45, -0.6], 7, [S * 2, 0], [S, 0]),
  ...bus([-0.6, -0.85], [-0.8, -0.2], 3, [S, 0], [0, S]),
  ...bus([1.15, 0.45], [1.35, 0.95], 2, [0, S], [S, 0]),
].map((pts) => ({ pts, r: 0.007 }))

const POWER: { pts: P[]; r: number }[] = [
  { pts: route([-1.0, -0.25], [-0.8, -0.05]), r: 0.018 },
  { pts: route([-1.2, 0.05], [-1.2, 0.18]), r: 0.02 },
  { pts: route([1.6, -0.1], [1.95, 0.4]), r: 0.02 },
]

const vertex = /* glsl */ `
  attribute float aOffset;
  attribute float aLen;
  varying float vS;
  varying float vOff;
  void main() {
    vS = uv.x * aLen;
    vOff = aOffset;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform float uPhase;
  uniform float uPulse;
  uniform vec3 uBase;
  uniform vec3 uGlow;
  varying float vS;
  varying float vOff;
  void main() {
    // uPhase is accumulated on the CPU (phase += speed * delta), so changing the
    // speed while scrolling never makes the pulse position jump (= no flashing).
    float p = fract(vS * 0.9 - uPhase + vOff);
    // Pulse fades to 0 at both ends of the cycle, so the fract() wrap is seamless.
    float fall = 1.0 - smoothstep(0.94, 1.0, p);
    float head = pow(clamp(p / 0.94, 0.0, 1.0), 14.0) * fall;
    float tail = smoothstep(0.55, 0.94, p) * 0.35 * fall;
    float glow = (head + tail) * (0.25 + 2.6 * uPulse) + 0.1 * uPulse;
    vec3 col = uBase + uGlow * glow;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export function SignalTraces() {
  const scroll = scrollState
  const material = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const rand = mulberry32(11)
    const parts = [...ROUTES, ...POWER].map(({ pts, r }) => {
      const path = new THREE.CurvePath<THREE.Vector3>()
      let len = 0
      for (let i = 0; i < pts.length - 1; i++) {
        const a = new THREE.Vector3(pts[i][0], TOP + 0.004, pts[i][1])
        const b = new THREE.Vector3(pts[i + 1][0], TOP + 0.004, pts[i + 1][1])
        len += a.distanceTo(b)
        path.add(new THREE.LineCurve3(a, b))
      }
      const g = new THREE.TubeGeometry(path, Math.max(8, Math.ceil(len * 60)), r, 4, false)
      const n = g.attributes.position.count
      const off = rand()
      g.setAttribute('aOffset', new THREE.BufferAttribute(new Float32Array(n).fill(off), 1))
      g.setAttribute('aLen', new THREE.BufferAttribute(new Float32Array(n).fill(len), 1))
      return g
    })
    const merged = mergeGeometries(parts)
    parts.forEach((p) => p.dispose())
    return merged
  }, [])

  const uniforms = useMemo(
    () => ({
      uPhase: { value: 0 },
      uPulse: { value: 0 },
      uBase: { value: new THREE.Color('#1c3a2a') },
      uGlow: { value: new THREE.Color('#6ee7f9') },
    }),
    [],
  )

  useFrame((_, rawDelta) => {
    if (!material.current) return
    // Clamp delta: after a tab switch / frame hitch a huge delta would skip the pulse.
    const delta = Math.min(rawDelta, 1 / 20)
    const s = getStage(scroll.offset)
    const u = material.current.uniforms
    // Smooth the pulse intensity, then integrate the phase using the *current* speed.
    u.uPulse.value = THREE.MathUtils.damp(u.uPulse.value, s.telemetry, 4, delta)
    const speed = 0.35 + u.uPulse.value * 1.6
    // Wrap to [0,1): fract() in the shader is periodic, so this is lossless and keeps float precision.
    u.uPhase.value = (u.uPhase.value + speed * delta) % 1
  })

  return (
    <mesh geometry={geometry}>
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  )
}
