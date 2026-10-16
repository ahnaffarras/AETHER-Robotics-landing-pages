'use client'

import { Suspense, useEffect, type RefObject } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Lightformer, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import { CameraRig } from './CameraRig'
import { RoboticsPCB } from './RoboticsPCB'
import { BenchGrid } from './bench-grid'

function Lights() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[5, 9, 4]} intensity={2.2} color="#ffffff" />
      {/* Cool + warm rim lights for edge highlights on copper and pins */}
      <directionalLight position={[-6, 2.5, -5]} intensity={2.4} color="#7dd3fc" />
      <directionalLight position={[6, 1.5, -6]} intensity={1.4} color="#fdba74" />
      <spotLight position={[0, 6, -6]} angle={0.5} penumbra={1} intensity={30} color="#e0f2fe" />
      <Environment resolution={256} environmentIntensity={0.55}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={2} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[6, 1, 1]} color="#bae6fd" />
        <Lightformer form="rect" intensity={1.5} position={[6, 2, -2]} rotation-y={-Math.PI / 2} scale={[6, 1, 1]} color="#fed7aa" />
        <Lightformer form="ring" intensity={1.2} position={[0, 2, -8]} scale={4} />
      </Environment>
    </>
  )
}

/**
 * Mounted inside <Suspense>, so it only runs once every sibling (PCB, grid, sparkles)
 * has resolved. It pre-compiles the shaders, waits for a few real frames and then
 * reports "ready" so the loading screen can fade out without a hitch.
 */
function ReadySignal({ onStage }: { onStage?: (stage: number) => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)

  useEffect(() => {
    let cancelled = false
    let raf = 0
    onStage?.(3)
    const finish = () => {
      let frames = 0
      const wait = () => {
        if (cancelled) return
        if (++frames >= 3) onStage?.(4)
        else raf = requestAnimationFrame(wait)
      }
      raf = requestAnimationFrame(wait)
    }
    Promise.resolve(gl.compileAsync(scene, camera))
      .catch(() => {})
      .then(finish)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [gl, scene, camera, onStage])

  return null
}

export default function Scene({
  eventSource,
  onStage,
}: {
  eventSource: RefObject<HTMLElement | null>
  onStage?: (stage: number) => void
}) {
  // Scene module has been downloaded and mounted.
  useEffect(() => {
    onStage?.(1)
  }, [onStage])

  return (
    <Canvas
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ position: [4.6, 6.4, 6.6], fov: 30, near: 0.1, far: 120 }}
      onCreated={() => onStage?.(2)}
      aria-label="Interactive 3D model of the AETHER-X1 compute module"
    >
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 18, 60]} />
      <Lights />
      <CameraRig />
      <Suspense fallback={null}>
        <RoboticsPCB />
        <BenchGrid />
        <Sparkles count={70} scale={[10, 6, 10]} position={[0, 2, 0]} size={1.6} speed={0.25} opacity={0.35} color="#9be8f5" />
        <ReadySignal onStage={onStage} />
      </Suspense>
    </Canvas>
  )
}
