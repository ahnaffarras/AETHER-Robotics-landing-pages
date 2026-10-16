import * as THREE from 'three'

export function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return [c, c.getContext('2d')!] as const
}

/** Dark FR-4 solder mask with glass-weave crosshatch and speckle. */
export function createFR4Texture() {
  const [c, ctx] = canvas(1024, 1024)
  const rand = mulberry32(7)
  ctx.fillStyle = '#0c1a14'
  ctx.fillRect(0, 0, 1024, 1024)
  ctx.globalAlpha = 0.07
  ctx.strokeStyle = '#2b4a3a'
  for (let i = 0; i < 1024; i += 6) {
    ctx.lineWidth = 1 + rand() * 1.5
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, 1024)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(1024, i)
    ctx.stroke()
  }
  ctx.globalAlpha = 1
  for (let i = 0; i < 9000; i++) {
    const v = rand()
    ctx.fillStyle = v > 0.5 ? 'rgba(60,90,75,0.12)' : 'rgba(0,0,0,0.25)'
    ctx.fillRect(rand() * 1024, rand() * 1024, 1.5, 1.5)
  }
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** Directional brushed-metal streaks, used as a roughness map. */
export function createBrushedTexture() {
  const [c, ctx] = canvas(512, 512)
  const rand = mulberry32(42)
  ctx.fillStyle = '#7a7a7a'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 2200; i++) {
    const y = rand() * 512
    const g = Math.floor(80 + rand() * 120)
    ctx.strokeStyle = `rgba(${g},${g},${g},${0.15 + rand() * 0.25})`
    ctx.lineWidth = rand() * 1.2
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(512, y + (rand() - 0.5) * 2)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.anisotropy = 8
  return tex
}

/** Transparent label texture for silkscreen / laser-etched chip markings. */
export function createLabelTexture(
  lines: string[],
  {
    width = 512,
    height = 256,
    color = '#8a8f94',
    weight = 500,
    align = 'center',
  }: {
    width?: number
    height?: number
    color?: string
    weight?: number
    align?: CanvasTextAlign
  } = {},
) {
  const [c, ctx] = canvas(width, height)
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  const size = Math.floor((height / Math.max(lines.length, 1)) * 0.62)
  lines.forEach((line, i) => {
    const s = i === 0 ? size : size * 0.72
    ctx.font = `${weight} ${s}px ui-monospace, SFMono-Regular, Menlo, monospace`
    const x = align === 'center' ? width / 2 : align === 'right' ? width - 8 : 8
    ctx.fillText(line, x, (height / lines.length) * (i + 0.5))
  })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}
