'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { scrollState } from '@/lib/scroll-store'
import * as THREE from 'three'
import { getStage } from '@/lib/choreography'

const vertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vPos;

  float grid(vec2 p, float size, float width) {
    vec2 g = abs(fract(p / size - 0.5) - 0.5) / fwidth(p / size);
    return 1.0 - min(min(g.x, g.y) / width, 1.0);
  }

  void main() {
    // Anti-static mat: darker inset rectangle with a thin border.
    vec2 m = abs(vPos) - vec2(3.4, 2.6);
    float inMat = 1.0 - step(0.0, max(m.x, m.y));
    float border = smoothstep(0.03, 0.0, abs(max(m.x, m.y)));

    float minor = grid(vPos, 0.25, 1.0) * 0.18;
    float major = grid(vPos, 1.0, 1.2) * 0.4;
    float fade = 1.0 - smoothstep(3.0, 11.0, length(vPos));

    vec3 base = mix(vec3(0.02), vec3(0.035, 0.045, 0.05), inMat);
    vec3 line = vec3(0.45, 0.55, 0.6);
    vec3 col = base + line * (minor + major) * fade + vec3(0.43, 0.9, 0.97) * border * 0.35;
    float a = (fade * 0.9 + inMat * 0.1) * uOpacity;
    gl_FragColor = vec4(col, a);
  }
`

export function BenchGrid() {
  const scroll = scrollState
  const mat = useRef<THREE.ShaderMaterial>(null)
  const group = useRef<THREE.Group>(null)
  const uniforms = useMemo(() => ({ uOpacity: { value: 1 } }), [])

  useFrame(() => {
    const s = getStage(scroll.offset)
    if (mat.current) mat.current.uniforms.uOpacity.value = s.bench
    if (group.current) group.current.visible = s.bench > 0.002
  })

  return (
    <group ref={group} position={[0, -0.122, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <shaderMaterial
          ref={mat}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </mesh>
      <ContactShadows position={[0, 0.002, 0]} scale={9} far={1.4} blur={2.4} opacity={0.85} resolution={512} color="#000000" />
    </group>
  )
}
