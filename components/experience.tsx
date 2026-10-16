'use client'

import { useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Hud } from './hud'
import { OverlayUI } from './OverlayUI'
import { scrollState } from '@/lib/scroll-store'

const Scene = dynamic(() => import('./three/Scene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-mono text-[11px] tracking-[0.3em] text-neutral-500 uppercase">
      Initializing AETHER-X1
    </div>
  ),
})

export function Experience() {
  const root = useRef<HTMLElement>(null)
  const scroller = useCallback((el: HTMLDivElement | null) => {
    scrollState.el = el
    if (!el) scrollState.offset = 0
  }, [])

  return (
    <main ref={root} className="relative h-dvh w-full overflow-hidden bg-[#050505]">
      <p className="sr-only">AETHER-X1 Neural Motion Compute Module by AETHER Robotics</p>
      <div className="absolute inset-0">
        <Scene eventSource={root} />
      </div>
      <div ref={scroller} className="no-scrollbar absolute inset-0 z-20 overflow-x-hidden overflow-y-auto">
        <OverlayUI />
      </div>
      <Hud />
    </main>
  )
}
