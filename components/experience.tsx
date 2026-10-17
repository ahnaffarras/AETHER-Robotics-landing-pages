'use client'

import { useCallback, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Hud } from './hud'
import { OverlayUI } from './OverlayUI'
import { LoadingScreen } from './loading-screen'
import { scrollState } from '@/lib/scroll-store'

const Scene = dynamic(() => import('./three/Scene'), {
  ssr: false,
  // The full-screen <LoadingScreen /> already covers this phase.
  loading: () => null,
})

export function Experience() {
  const root = useRef<HTMLElement>(null)
  // 0 = booting, 1 = scene module loaded, 2 = canvas created, 3 = compiling shaders, 4 = ready
  const [stage, setStage] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const onStage = useCallback((n: number) => setStage((cur) => Math.max(cur, n)), [])
  const onDone = useCallback(() => setLoaded(true), [])
  const scroller = useCallback((el: HTMLDivElement | null) => {
    scrollState.el = el
    if (!el) scrollState.offset = 0
  }, [])

  return (
    <main ref={root} className="relative h-dvh w-full overflow-hidden bg-[#050505]">
      <p className="sr-only">AETHER-X5 Neural Motion Compute Module by AETHER Robotics</p>
      <div className="absolute inset-0">
        <Scene eventSource={root} onStage={onStage} />
      </div>
      <div
        ref={scroller}
        inert={!loaded}
        className="no-scrollbar absolute inset-0 z-20 overflow-x-hidden overflow-y-auto"
      >
        <OverlayUI />
      </div>
      <Hud />
      <LoadingScreen stage={stage} onDone={onDone} />
    </main>
  )
}
