'use client'

import { useEffect, useState } from 'react'
import type { LucideIcon } from 'lucide-react'

type Row = {
  icon: LucideIcon
  label: string
  unit: string
  base: number
  jitter: number
  digits: number
  max: number
  prefix?: string
}

export function TelemetryReadout({ rows }: { rows: Row[] }) {
  const [values, setValues] = useState(() => rows.map((r) => r.base))

  useEffect(() => {
    const id = setInterval(() => {
      setValues(rows.map((r) => r.base + (Math.random() - 0.5) * 2 * r.jitter))
    }, 450)
    return () => clearInterval(id)
  }, [rows])

  return (
    <ul className="mt-6 flex flex-col gap-5" aria-live="off">
      {rows.map((r, i) => {
        const Icon = r.icon
        const pct = Math.min(100, (values[i] / r.max) * 100)
        return (
          <li key={r.label}>
            <div className="flex items-baseline justify-between gap-4">
              <span className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-neutral-500 uppercase">
                <Icon className="size-3.5 text-signal" aria-hidden="true" />
                {r.label}
              </span>
              <span className="font-mono text-lg tabular-nums text-neutral-100">
                {r.prefix && <span className="mr-1 text-neutral-500">{r.prefix}</span>}
                {values[i].toFixed(r.digits)}
                <span className="ml-1 text-xs text-neutral-500">{r.unit}</span>
              </span>
            </div>
            <div className="mt-2 h-px w-full bg-white/10">
              <div className="h-px bg-signal transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
