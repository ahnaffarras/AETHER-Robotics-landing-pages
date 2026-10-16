'use client'

import { ArrowDown, ArrowUpRight, Cpu, Download, Gauge, Layers, Thermometer, Zap } from 'lucide-react'
import { TelemetryReadout } from './telemetry-readout'

/** Scroll offset (0..1) → top position in vh for `pages` scroll pages. */
export const PAGES = 9
const at = (offset: number) => `${offset * (PAGES - 1) * 100}vh`

function Section({
  offset,
  className = '',
  children,
  label,
}: {
  offset: number
  className?: string
  children: React.ReactNode
  label: string
}) {
  return (
    <section
      aria-label={label}
      className={`absolute inset-x-0 flex h-screen px-5 pt-24 pb-10 md:px-12 md:pb-14 ${className}`}
      style={{ top: at(offset) }}
    >
      {children}
    </section>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[11px] tracking-[0.25em] text-signal uppercase">
      <span aria-hidden="true" className="h-px w-8 bg-signal/60" />
      {children}
    </p>
  )
}

const SPECS = [
  ['Neural compute', '120 TOPS INT8 · 4nm NPU'],
  ['Application CPU', '8× Cortex-A78AE @ 2.2 GHz'],
  ['Real-time core', '2× Cortex-R52 lockstep'],
  ['Memory', '16 GB LPDDR5 · 204 GB/s'],
  ['Motion I/O', '2× EtherCAT · 2× CAN-FD'],
  ['Motor drive', 'Dual 3-phase 48 V / 20 A'],
  ['Sensing', '6-axis IMU · 8 kHz, HW timestamped'],
  ['Power', '12–48 V input · 25 W typical'],
  ['Thermal', '−40 to 85 °C operating'],
  ['Software', 'ROS 2 Jazzy · Zephyr RTOS'],
]

export function OverlayUI() {
  return (
    <div className="relative w-screen text-neutral-100" style={{ height: `${PAGES * 100}vh` }}>
      {/* 01 — Docked on bench */}
      <Section offset={0} label="Introduction" className="items-end">
        <div className="flex w-full flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>AETHER Robotics · Neural Motion Compute</Eyebrow>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance md:text-7xl lg:text-8xl">
              AETHER-X1
            </h1>
            <p className="mt-3 text-2xl font-light tracking-tight text-neutral-300 text-balance md:text-4xl">
              The Robotic Nervous System.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {['ROS2 Native', '120 TOPS', 'EtherCAT Master'].map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-white/15 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] tracking-wider text-neutral-300 uppercase backdrop-blur"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
          <p className="flex items-center gap-3 font-mono text-[11px] tracking-[0.25em] text-neutral-500 uppercase">
            <span className="flex size-8 items-center justify-center rounded-full border border-white/15">
              <ArrowDown className="size-3.5 animate-bounce" aria-hidden="true" />
            </span>
            Scroll to inspect
          </p>
        </div>
      </Section>

      {/* 02 — Zero-G isolation */}
      <Section offset={0.3} label="Real-time control" className="items-center">
        <div className="max-w-md">
          <Eyebrow>02 — Isolation</Eyebrow>
          <h2 className="mt-5 text-4xl font-semibold tracking-tight text-balance md:text-5xl">
            Deterministic at 20&nbsp;kHz.
          </h2>
          <p className="mt-5 leading-relaxed text-neutral-400 text-pretty">
            A lockstep real-time core closes current, velocity and position loops in hardware, while EtherCAT
            distributed clocks keep every joint in your robot synchronized to the microsecond.
          </p>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-white/10 pt-6">
            <div>
              <dt className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">Control loop</dt>
              <dd className="mt-1 text-2xl font-medium">20 kHz</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] tracking-widest text-neutral-500 uppercase">Sync jitter</dt>
              <dd className="mt-1 text-2xl font-medium">{'< 1 µs'}</dd>
            </div>
          </dl>
        </div>
      </Section>

      {/* 03 — Exploded architecture */}
      <Section offset={0.54} label="Exploded architecture" className="items-end">
        <div className="max-w-sm">
          <Eyebrow>03 — Architecture</Eyebrow>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-balance md:text-4xl">
            Four layers. Zero compromise.
          </h2>
          <ol className="mt-6 flex flex-col gap-2 font-mono text-xs text-neutral-400">
            {[
              ['L1', 'CNC 6063 anodized heatsink'],
              ['L2', 'NPU, memory and motion ICs'],
              ['L3', '12-layer HDI core, 3oz copper'],
              ['L4', 'Tin-plated EMI shield'],
            ].map(([k, v]) => (
              <li key={k} className="flex items-center gap-3">
                <span className="text-signal">{k}</span>
                <span className="h-px w-4 bg-white/15" aria-hidden="true" />
                {v}
              </li>
            ))}
          </ol>
        </div>
      </Section>

      {/* 04 — Telemetry */}
      <Section offset={0.77} label="Bus telemetry" className="items-center justify-start md:justify-end">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <Eyebrow>04 — Live telemetry</Eyebrow>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">Every signal, accounted for.</h2>
          <TelemetryReadout
            rows={[
              { icon: Gauge, label: 'Loop latency', unit: 'ms', base: 0.072, jitter: 0.012, digits: 3, max: 0.1, prefix: '<' },
              { icon: Zap, label: 'Efficiency', unit: 'TOPS/W', base: 4.8, jitter: 0.08, digits: 2, max: 6 },
              { icon: Thermometer, label: 'NPU junction', unit: '°C', base: 61, jitter: 1.4, digits: 1, max: 105 },
              { icon: Cpu, label: 'EtherCAT cycle', unit: 'µs', base: 62.5, jitter: 0.3, digits: 1, max: 125 },
            ]}
          />
        </div>
      </Section>

      {/* 05 — Spec sheet */}
      <Section offset={1} label="Specifications" className="items-center justify-end">
        <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#050505]/70 p-5 backdrop-blur-md md:bg-transparent md:p-0 md:backdrop-blur-none md:border-0">
          <Eyebrow>05 — Spec sheet</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance md:text-5xl">
            AETHER-X1 Enterprise Dev Kit
          </h2>
          <dl className="mt-6 grid grid-cols-1 border-t border-white/10 sm:grid-cols-2 sm:gap-x-8">
            {SPECS.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 border-b border-white/10 py-2.5">
                <dt className="font-mono text-[10px] tracking-widest text-neutral-500 uppercase">{k}</dt>
                <dd className="text-sm text-neutral-200">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:enterprise@aether-robotics.com?subject=AETHER-X1%20Enterprise%20Dev%20Kit"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-neutral-100 px-6 py-3 text-sm font-medium text-neutral-950 transition-colors hover:bg-signal focus-visible:ring-2 focus-visible:ring-signal focus-visible:outline-none"
            >
              Order Enterprise Dev Kit
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
            <a
              href="/datasheet"
              download
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-neutral-100 transition-colors hover:border-white/50 focus-visible:ring-2 focus-visible:ring-signal focus-visible:outline-none"
            >
              <Download className="size-4" aria-hidden="true" />
              Download datasheet
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2 font-mono text-[10px] tracking-widest text-neutral-600 uppercase">
            <Layers className="size-3" aria-hidden="true" />
            Ships Q1 2027 · Volume pricing available · created by ahnaffarras
          </p>
        </div>
      </Section>
    </div>
  )
}
