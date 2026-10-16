'use client'

import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { scrollState } from '@/lib/scroll-store'
import * as THREE from 'three'
import { getStage } from '@/lib/choreography'
import { BOARD, CHIPS, NPU, TOP, scatter, type ChipSpec } from '@/lib/pcb-layout'
import { mulberry32 } from '@/lib/procedural-textures'
import { InstancedBoxes, Label, getMaterials, perimeterPins, type BoxItem } from './pcb-primitives'
import { SignalTraces } from './signal-traces'
import { ThermalMap } from './thermal-map'
import { Annotation } from './annotation'

const MOUNTS: [number, number][] = [
  [-1.95, -1.3],
  [1.95, -1.3],
  [-1.95, 1.3],
  [1.95, 1.3],
]

/* ---------- Layer: bottom EMI shield ---------- */
function Shield() {
  const m = getMaterials()
  const y = -BOARD.h / 2 - 0.075
  const w = 4.0
  const d = 2.8
  return (
    <group>
      <mesh position={[0, y, 0]} material={m.steel}>
        <boxGeometry args={[w, 0.012, d]} />
      </mesh>
      {[
        [0, -d / 2, w, 0.012],
        [0, d / 2, w, 0.012],
        [-w / 2, 0, 0.012, d],
        [w / 2, 0, 0.012, d],
      ].map(([x, z, sx, sz], i) => (
        <mesh key={i} position={[x, y + 0.03, z]} material={m.steel}>
          <boxGeometry args={[sx, 0.06, sz]} />
        </mesh>
      ))}
      {MOUNTS.map(([x, z], i) => (
        <mesh key={i} position={[x, y + 0.035, z]} material={m.gold}>
          <cylinderGeometry args={[0.055, 0.055, 0.07, 6]} />
        </mesh>
      ))}
    </group>
  )
}

/* ---------- Layer: PCB core (substrate, vias, passives, connectors) ---------- */
function Vias() {
  const ref = useRef<THREE.InstancedMesh>(null)
  const pts = useMemo(() => scatter(340, 3, 0.02), [])
  const geo = useMemo(() => new THREE.CylinderGeometry(0.016, 0.016, 0.004, 12), [])
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const mat = new THREE.Matrix4()
    pts.forEach(([x, z], i) => {
      mat.makeTranslation(x, TOP + 0.002, z)
      mesh.setMatrixAt(i, mat)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [pts])
  return <instancedMesh ref={ref} args={[geo, getMaterials().gold, pts.length]} />
}

function Passives() {
  const { bodies, terminals } = useMemo(() => {
    const rand = mulberry32(21)
    const pts = scatter(190, 9, 0.04)
    const bodies: BoxItem[] = []
    const terminals: BoxItem[] = []
    pts.forEach(([x, z]) => {
      const cap = rand() > 0.45
      const big = rand() > 0.85
      const L = big ? 0.12 : 0.075
      const W = big ? 0.065 : 0.04
      const H = cap ? (big ? 0.06 : 0.04) : 0.028
      const ry = rand() > 0.5 ? 0 : Math.PI / 2
      const color = cap ? (rand() > 0.5 ? '#8b6b48' : '#6f5338') : '#141414'
      bodies.push({ p: [x, TOP + H / 2, z], s: [L * 0.72, H, W], ry, color })
      const tx = Math.cos(ry) * (L * 0.42)
      const tz = -Math.sin(ry) * (L * 0.42)
      terminals.push({ p: [x + tx, TOP + H / 2, z + tz], s: [L * 0.16, H * 1.02, W * 1.02], ry })
      terminals.push({ p: [x - tx, TOP + H / 2, z - tz], s: [L * 0.16, H * 1.02, W * 1.02], ry })
    })
    return { bodies, terminals }
  }, [])
  const m = getMaterials()
  return (
    <group>
      <InstancedBoxes items={bodies} material={m.smd} />
      <InstancedBoxes items={terminals} material={m.pin} />
    </group>
  )
}

function EtherCATJack({ z }: { z: number }) {
  const m = getMaterials()
  const h = 0.42
  return (
    <group position={[-1.91, TOP + h / 2, z]}>
      <mesh material={m.nickel}>
        <boxGeometry args={[0.62, h, 0.5]} />
      </mesh>
      <mesh position={[-0.312, -0.02, 0]} material={m.plastic}>
        <boxGeometry args={[0.01, 0.26, 0.34]} />
      </mesh>
      <mesh position={[-0.315, 0.16, -0.18]} material={m.ledGreen}>
        <boxGeometry args={[0.006, 0.04, 0.07]} />
      </mesh>
      <mesh position={[-0.315, 0.16, 0.18]} material={m.ledAmber}>
        <boxGeometry args={[0.006, 0.04, 0.07]} />
      </mesh>
    </group>
  )
}

function Connectors() {
  const m = getMaterials()
  const headerPins = useMemo(() => {
    const items: BoxItem[] = []
    for (let i = 0; i < 20; i++) {
      for (let r = 0; r < 2; r++) {
        items.push({ p: [-1.2 + i * 0.1 + 0.05, TOP + 0.17, -1.38 + r * 0.1], s: [0.022, 0.26, 0.022] })
      }
    }
    return items
  }, [])
  const canPins = useMemo(() => {
    const items: BoxItem[] = []
    for (let i = 0; i < 6; i++) items.push({ p: [0.05 + i * 0.12, TOP + 0.12, 1.33], s: [0.02, 0.14, 0.02] })
    return items
  }, [])
  return (
    <group>
      <EtherCATJack z={0.3} />
      <EtherCATJack z={0.85} />

      {/* Motor power terminal block */}
      <group position={[1.95, TOP + 0.16, 0.85]}>
        <mesh material={m.green}>
          <boxGeometry args={[0.32, 0.32, 0.82]} />
        </mesh>
        {[-0.3, -0.1, 0.1, 0.3].map((z) => (
          <mesh key={z} position={[0, 0.165, z]} material={m.pin}>
            <cylinderGeometry args={[0.055, 0.055, 0.02, 16]} />
          </mesh>
        ))}
      </group>

      {/* CAN-FD connector */}
      <group position={[0.35, TOP + 0.13, 1.33]}>
        <mesh material={m.ivory}>
          <boxGeometry args={[0.8, 0.26, 0.26]} />
        </mesh>
        <mesh position={[0, 0.06, 0.06]} material={m.plastic}>
          <boxGeometry args={[0.74, 0.16, 0.16]} />
        </mesh>
      </group>
      <InstancedBoxes items={canPins} material={m.gold} />

      {/* 2x20 GPIO header */}
      <mesh position={[-0.25, TOP + 0.05, -1.33]} material={m.plastic}>
        <boxGeometry args={[2.02, 0.1, 0.2]} />
      </mesh>
      <InstancedBoxes items={headerPins} material={m.gold} />

      {/* Power inductors */}
      {[0.32, 0.78].map((z) => (
        <mesh key={z} position={[-1.2, TOP + 0.09, z]} material={m.epoxy}>
          <boxGeometry args={[0.3, 0.18, 0.3]} />
        </mesh>
      ))}

      {/* Bulk electrolytic caps */}
      {[0.95, 1.35].map((x) => (
        <group key={x} position={[x, TOP, 1.15]}>
          <mesh position={[0, 0.2, 0]} material={m.steel}>
            <cylinderGeometry args={[0.16, 0.16, 0.4, 32]} />
          </mesh>
          <mesh position={[0, 0.401, 0]} material={m.nickel}>
            <cylinderGeometry args={[0.14, 0.14, 0.004, 32]} />
          </mesh>
        </group>
      ))}

      {/* Crystal */}
      <mesh position={[-0.25, TOP + 0.02, -0.95]} material={m.nickel}>
        <boxGeometry args={[0.16, 0.04, 0.1]} />
      </mesh>
    </group>
  )
}

function Substrate() {
  const m = getMaterials()
  return (
    <group>
      <mesh material={m.fr4}>
        <boxGeometry args={[BOARD.w, BOARD.h, BOARD.d]} />
      </mesh>
      {/* Exposed copper edge plating */}
      <mesh material={m.copper}>
        <boxGeometry args={[BOARD.w + 0.012, BOARD.h * 0.35, BOARD.d + 0.012]} />
      </mesh>
      {MOUNTS.map(([x, z], i) => (
        <group key={i} position={[x, TOP + 0.002, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} material={m.gold}>
            <ringGeometry args={[0.05, 0.11, 32]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]} material={m.hole}>
            <circleGeometry args={[0.05, 32]} />
          </mesh>
        </group>
      ))}
      <Label lines={['AETHER-X1', 'REV C · 2026']} w={0.9} d={0.22} position={[-1.35, TOP + 0.003, 1.3]} color="#c9d1cc" opacity={0.75} />
      <Label lines={['ETHERCAT']} w={0.5} d={0.08} position={[-1.35, TOP + 0.003, 0.58]} rotationY={Math.PI / 2} color="#c9d1cc" opacity={0.6} />
      <Label lines={['CAN-FD']} w={0.4} d={0.08} position={[0.35, TOP + 0.003, 1.1]} color="#c9d1cc" opacity={0.6} />
      <Label lines={['M+ A  M- A  M+ B  M- B']} w={0.9} d={0.08} position={[1.68, TOP + 0.003, 0.85]} rotationY={Math.PI / 2} color="#c9d1cc" opacity={0.6} />
      <Label lines={['J1 · GPIO']} w={0.4} d={0.08} position={[0.95, TOP + 0.003, -1.33]} color="#c9d1cc" opacity={0.6} />
    </group>
  )
}

/* ---------- Layer: compute (NPU + ICs) ---------- */
function Chip({ spec }: { spec: ChipSpec }) {
  const m = getMaterials()
  const y = TOP + 0.01 + spec.h / 2
  const pins = useMemo(
    () => (spec.pins === 'none' ? [] : perimeterPins(spec.w, spec.d, spec.pinsPerSide, TOP + 0.008, spec.pins)),
    [spec],
  )
  return (
    <group position={[spec.x, 0, spec.z]}>
      <mesh position={[0, y, 0]} material={m.epoxy}>
        <boxGeometry args={[spec.w, spec.h, spec.d]} />
      </mesh>
      {pins.length > 0 && <InstancedBoxes items={pins} material={m.pin} />}
      <Label lines={spec.label} w={spec.w * 0.8} d={spec.d * 0.6} position={[0, y + spec.h / 2 + 0.001, 0.01]} />
      <mesh position={[-spec.w * 0.36, y + spec.h / 2 + 0.0015, -spec.d * 0.36]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.012, 16]} />
        <meshStandardMaterial color="#2a2c2f" roughness={0.3} />
      </mesh>
    </group>
  )
}

export const NPU_LID_TOP = TOP + 0.01 + 0.05 + 0.04

function NeuralProcessor() {
  const m = getMaterials()
  const caps = useMemo(() => {
    const items: BoxItem[] = []
    for (let i = 0; i < 10; i++) {
      const f = (i + 0.5) / 10 - 0.5
      items.push({ p: [f * 0.95, TOP + 0.075, -0.52], s: [0.04, 0.02, 0.025], color: '#8b6b48' })
      items.push({ p: [f * 0.95, TOP + 0.075, 0.52], s: [0.04, 0.02, 0.025], color: '#8b6b48' })
    }
    return items
  }, [])
  return (
    <group position={[NPU.x, 0, NPU.z]}>
      <mesh position={[0, TOP + 0.005, 0]} material={m.pin}>
        <boxGeometry args={[NPU.size - 0.04, 0.01, NPU.size - 0.04]} />
      </mesh>
      <mesh position={[0, TOP + 0.035, 0]} material={m.package}>
        <boxGeometry args={[NPU.size, 0.05, NPU.size]} />
      </mesh>
      <InstancedBoxes items={caps} material={m.smd} />
      <mesh position={[0, TOP + 0.08, 0]} material={m.nickel}>
        <boxGeometry args={[NPU.lid, 0.04, NPU.lid]} />
      </mesh>
      <Label
        lines={['AETHER NPU-X1', '120 TOPS · 4NM', 'AX1-7740 TW']}
        w={0.7}
        d={0.36}
        position={[0, NPU_LID_TOP + 0.001, 0]}
        color="#5d6268"
      />
    </group>
  )
}

/* ---------- Layer: CNC heatsink ---------- */
function Heatsink() {
  const m = getMaterials()
  const size = 1.46
  const fins = useMemo(() => {
    const items: BoxItem[] = []
    const n = 13
    for (let i = 0; i < n; i++) {
      const x = -size / 2 + 0.05 + (i * (size - 0.1)) / (n - 1)
      items.push({ p: [x, 0.06 + 0.22, 0], s: [0.035, 0.44, size] })
    }
    return items
  }, [])
  return (
    <group position={[NPU.x, NPU_LID_TOP, NPU.z]}>
      <mesh position={[0, 0.03, 0]} material={m.anodized}>
        <boxGeometry args={[size, 0.06, size]} />
      </mesh>
      <InstancedBoxes items={fins} material={m.anodized} />
      <mesh position={[0, 0.002, 0]} material={m.plastic}>
        <boxGeometry args={[0.84, 0.004, 0.84]} />
      </mesh>
    </group>
  )
}

/* ---------- Assembly + choreography ---------- */
export function RoboticsPCB() {
  const scroll = scrollState
  const root = useRef<THREE.Group>(null)
  const heatsink = useRef<THREE.Group>(null)
  const compute = useRef<THREE.Group>(null)
  const shield = useRef<THREE.Group>(null)
  const { size } = useThree()
  const m = getMaterials()

  useFrame((state, delta) => {
    if (!root.current || !heatsink.current || !compute.current || !shield.current) return
    const s = getStage(scroll.offset)
    const t = state.clock.elapsedTime
    const wide = size.width > size.height
    const zeroG = s.lift * (1 - s.dock)
    const d = (cur: number, target: number, l = 6) => THREE.MathUtils.damp(cur, target, l, delta)

    const g = root.current
    g.position.y = d(g.position.y, s.lift * 1.2 + Math.sin(t * 1.1) * 0.05 * zeroG)
    g.position.x = d(g.position.x, (wide ? -1.35 : 0) * s.dock)
    g.rotation.x = d(g.rotation.x, (0.32 * s.lift - 0.2 * s.explode) * (1 - s.dock) + Math.sin(t * 0.7) * 0.02 * zeroG)
    g.rotation.z = d(g.rotation.z, -0.14 * s.lift * (1 - s.explode) * (1 - s.dock) + Math.cos(t * 0.6) * 0.015 * zeroG)
    g.rotation.y = d(g.rotation.y, -0.35 * s.explode + 0.18 * s.telemetry * (1 - s.dock))

    heatsink.current.position.y = d(heatsink.current.position.y, s.explode * 1.75, 10)
    compute.current.position.y = d(compute.current.position.y, s.explode * 0.85, 10)
    shield.current.position.y = d(shield.current.position.y, -s.explode * 0.95, 10)

    m.anodized.emissiveIntensity = s.telemetry * 0.18
  })

  return (
    <group ref={root}>
      <group ref={shield}>
        <Shield />
      </group>

      <group>
        <Substrate />
        <Vias />
        <SignalTraces />
        <Passives />
        <Connectors />
        <ThermalMap />
        <Annotation
          anchor={[1.95, TOP + 0.33, 0.6]}
          elbow={[2.35, TOP + 0.75, 0.6]}
          end={[2.9, TOP + 0.75, 0.6]}
          code="03 / Motion Bus"
          title="Dual Motor Driver Bus"
          detail="2× 3-phase 48V / 20A FOC drivers with isolated current sensing."
          delay={0.3}
        />
      </group>

      <group ref={compute}>
        <NeuralProcessor />
        {CHIPS.map((c) => (
          <Chip key={c.id} spec={c} />
        ))}
        <Annotation
          anchor={[NPU.x + 0.3, NPU_LID_TOP, NPU.z + 0.3]}
          elbow={[NPU.x - 0.9, NPU_LID_TOP + 0.55, NPU.z + 0.9]}
          end={[NPU.x - 1.7, NPU_LID_TOP + 0.55, NPU.z + 0.9]}
          code="01 / Compute"
          title="120 TOPS Neural Core"
          detail="4nm NPU with 16GB LPDDR5 for on-device policy inference."
          side="left"
        />
        <Annotation
          anchor={[-1.45, TOP + 0.06, -0.95]}
          elbow={[-1.95, TOP + 0.5, -1.35]}
          end={[-2.6, TOP + 0.5, -1.35]}
          code="02 / Sensing"
          title="Integrated 6-Axis IMU"
          detail="Hardware-timestamped at 8 kHz, fused on the R52 real-time core."
          side="left"
          delay={0.15}
        />
      </group>

      <group ref={heatsink}>
        <Heatsink />
      </group>
    </group>
  )
}
