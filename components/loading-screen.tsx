'use client'

import { useEffect, useRef, useState } from 'react'

const MIN_DURATION = 1400 // ms, so the screen never just "blinks"
const MAX_DURATION = 15000 // ms, safety net (e.g. WebGL unavailable) so the site never stays locked
const FADE_MS = 700

// Progress ceiling for every loading stage reported by <Scene />.
const STAGE_TARGET = [12, 35, 60, 88, 100]
const STAGE_LABEL = [
  'Booting system',
  'Loading 3D engine',
  'Building circuit board',
  'Compiling shaders',
  'Systems online',
]

export function LoadingScreen({ stage, onDone }: { stage: number; onDone: () => void }) {
  const [progress, setProgress] = useState(0)
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  const stageRef = useRef(stage)
  stageRef.current = stage
  const barRef = useRef<HTMLDivElement>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const start = performance.now()
    let raf = 0
    let value = 0
    let last = start
    let finished = false
    let lastShown = -1

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const elapsed = now - start

      let target = STAGE_TARGET[Math.min(stageRef.current, STAGE_TARGET.length - 1)]
      // Never reach 100% before the minimum duration has passed.
      if (elapsed < MIN_DURATION) target = Math.min(target, 12 + (elapsed / MIN_DURATION) * 83)
      if (elapsed > MAX_DURATION) target = 100

      // Ease towards target, slow trickle so the bar always feels alive.
      value += (target - value) * Math.min(1, dt * 5)
      if (target - value < 0.05) value = target

      if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`
      const shown = Math.round(value)
      if (shown !== lastShown) {
        lastShown = shown
        setProgress(shown)
      }

      if (value >= 100 && !finished) {
        finished = true
        setTimeout(() => {
          setFading(true)
          doneRef.current()
          setTimeout(() => setGone(true), FADE_MS)
        }, 250)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (gone) return null

  const label = STAGE_LABEL[Math.min(stage, STAGE_LABEL.length - 1)]

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading AETHER-X5"
      style={{ transitionDuration: `${FADE_MS}ms` }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] transition-opacity ease-out ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-8">
        <span aria-hidden="true" className="grid size-10 grid-cols-2 gap-1">
          <span className="loader-cell rounded-[3px] bg-neutral-100" style={{ animationDelay: '0ms' }} />
          <span className="loader-cell rounded-[3px] bg-signal" style={{ animationDelay: '150ms' }} />
          <span className="loader-cell rounded-[3px] bg-neutral-600" style={{ animationDelay: '450ms' }} />
          <span className="loader-cell rounded-[3px] bg-neutral-100" style={{ animationDelay: '300ms' }} />
        </span>

        <div className="flex flex-col items-center gap-2">
          <span className="text-sm font-semibold tracking-[0.35em] text-neutral-100">AETHER-X5</span>
          <span className="font-mono text-[10px] tracking-[0.3em] text-neutral-500 uppercase">
            Neural Motion Compute Module
          </span>
        </div>

        <div className="flex w-64 flex-col gap-3 sm:w-80">
          <div className="relative h-px w-full overflow-hidden bg-white/10">
            <div
              ref={barRef}
              className="absolute inset-0 origin-left bg-signal shadow-[0_0_12px_var(--color-signal)]"
              style={{ transform: 'scaleX(0)' }}
            />
            <div className="loader-scan absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] tracking-widest text-neutral-500 uppercase">
            <span>{label}</span>
            <span className="text-neutral-300 tabular-nums">{String(progress).padStart(3, '0')}%</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes loader-cell { 0%, 100% { opacity: .25; transform: scale(.85); } 50% { opacity: 1; transform: scale(1); } }
        @keyframes loader-scan { from { transform: translateX(-100%); } to { transform: translateX(400%); } }
        .loader-cell { animation: loader-cell 1.2s ease-in-out infinite; }
        .loader-scan { animation: loader-scan 1.6s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .loader-cell, .loader-scan { animation: none; } }
      `}</style>
    </div>
  )
}
