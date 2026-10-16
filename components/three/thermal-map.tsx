'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { scrollState } from '@/lib/scroll-store'
import * as THREE from 'three'
import { getStage } from '@/lib/choreography'
import { BOARD, HOTSPOTS, TOP } from '@/lib/pcb-layout'

const vertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragment = /* glsl */ `
  uniform float uHeat;
  uniform float uTime;
  uniform vec4 uSpots[4];
  varying vec2 vPos;

  vec3 ramp(float t) {
    vec3 c0 = vec3(0.05, 0.15, 0.55);
    vec3 c1 = vec3(0.1, 0.75, 0.95);
    vec3 c2 = vec3(1.0, 0.82, 0.25);
    vec3 c3 = vec3(1.0, 0.25, 0.1);
    if (t < 0.33) return mix(c0, c1, t / 0.33);
    if (t < 0.66) return mix(c1, c2, (t - 0.33) / 0.33);
    return mix(c2, c3, (t - 0.66) / 0.34);
  }

  void main() {
    float h = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 d = vPos - uSpots[i].xy;
      float r = uSpots[i].z;
      float flicker = 0.92 + 0.08 * sin(uTime * 3.0 + float(i) * 1.7);
      h += uSpots[i].w * exp(-dot(d, d) / (r * r)) * flicker;
    }
    h = clamp(h, 0.0, 1.0);
    float a = smoothstep(0.04, 0.6, h) * uHeat * 0.75;
    gl_FragColor = vec4(ramp(h) * a, a);
  }
`

export function ThermalMap() {
  const scroll = scrollState
  const mat = useRef<THREE.ShaderMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uHeat: { value: 0 },
      uTime: { value: 0 },
      // Plane is rotated -90° on X, so board z maps to -y in plane space.
      uSpots: { value: HOTSPOTS.map(([x, z, r, s]) => new THREE.Vector4(x, -z, r, s)) },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (!mat.current || !mesh.current) return
    const s = getStage(scroll.offset)
    mat.current.uniforms.uTime.value += delta
    mat.current.uniforms.uHeat.value = s.telemetry
    mesh.current.visible = s.telemetry > 0.002
  })

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, TOP + 0.012, 0]} renderOrder={2}>
      <planeGeometry args={[BOARD.w, BOARD.d]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}
