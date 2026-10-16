'use client'

import { useEffect, useRef, useState } from 'react'
import { PHASES, phaseIndexAt } from '@/lib/choreography'
import { scrollState, scrollToOffset } from '@/lib/scroll-store'

export function Hud() {
  const [active, setActive] = useState(0)
  const bar = useRef<HTMLDivElement>(null)
  const readout = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let last = -1
    const tick = () => {
      const o = scrollState.offset
      if (bar.current) bar.current.style.transform = `scaleY(${o})`
      if (readout.current) readout.current.textContent = o.toFixed(3)
      const idx = phaseIndexAt(o)
      if (idx !== last) {
        last = idx
        setActive(idx)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <header className="flex items-center justify-between px-5 py-5 md:px-12">
        <a href="#" className="pointer-events-auto flex items-center gap-2.5" aria-label="AETHER Robotics home">
          <span aria-hidden="true" className="grid size-6 grid-cols-2 gap-0.5">
            <span className="rounded-[2px] bg-neutral-100" />
            <span className="rounded-[2px] bg-signal" />
            <span className="rounded-[2px] bg-neutral-600" />
            <span className="rounded-[2px] bg-neutral-100" />
          </span>
          <span className="text-sm font-semibold tracking-[0.3em] text-neutral-100">AETHER</span>
        </a>
        <nav aria-label="Sections" className="hidden items-center gap-7 md:flex">
          {PHASES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => scrollToOffset(p.focus)}
              className={`pointer-events-auto font-mono text-[11px] tracking-widest uppercase transition-colors hover:text-neutral-100 ${
                active === i ? 'text-neutral-100' : 'text-neutral-500'
              }`}
              aria-current={active === i ? 'step' : undefined}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => scrollToOffset(1)}
          className="pointer-events-auto rounded-full border border-white/15 px-4 py-2 font-mono text-[11px] tracking-widest text-neutral-100 uppercase transition-colors hover:border-signal hover:text-signal"
        >
          Dev Kit
        </button>
      </header>

      <div className="absolute top-1/2 right-5 hidden -translate-y-1/2 items-center gap-4 md:right-8 lg:flex">
        <ol className="flex flex-col items-end gap-3">
          {PHASES.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => scrollToOffset(p.focus)}
                className={`pointer-events-auto font-mono text-[10px] tracking-widest transition-colors ${
                  active === i ? 'text-signal' : 'text-neutral-600 hover:text-neutral-300'
                }`}
                aria-label={`Go to ${p.label}`}
              >
                {p.index}
              </button>
            </li>
          ))}
        </ol>
        <div className="relative h-36 w-px bg-white/10" aria-hidden="true">
          <div ref={bar} className="absolute inset-0 origin-top bg-signal" style={{ transform: 'scaleY(0)' }} />
        </div>
      </div>

      <div className="absolute right-5 bottom-5 hidden font-mono text-[10px] tracking-widest text-neutral-600 uppercase md:right-12 md:block">
        {PHASES[active].index} / {PHASES[active].label} · <span ref={readout}>0.000</span>
      </div>
    </div>
  )
}
