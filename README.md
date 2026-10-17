# AETHER-X5 · The Robotic Nervous System

An immersive, scroll-driven product website for the **AETHER-X5 Neural Motion Compute Module**, a fictional robotics controller by **AETHER Robotics**. The page tells the product story through a real-time 3D model of the board: as you scroll, the camera moves, the board lifts off the bench, explodes into layers, and finally docks beside the spec sheet.

## What is this?

A single-page "scrollytelling" experience that showcases the AETHER-X5 compute module:

- 120 TOPS NPU (4nm) with 16GB LPDDR5 for on-device policy inference
- ROS 2 native
- Dual EtherCAT ports and CAN-FD
- 2x 3-phase 48V / 20A FOC motor drivers with isolated current sensing
- Integrated 6-axis IMU, hardware-timestamped at 8 kHz

The entire PCB (substrate, vias, passives, connectors, NPU, heatsink, EMI shield) is built procedurally in code. There are no external 3D model files.

## Scroll chapters

| # | Chapter | What happens |
|---|---------|--------------|
| 01 | Bench | The board rests on a lab bench grid |
| 02 | Isolation | The board lifts off the bench into a "zero-g" float |
| 03 | Architecture | Exploded view: heatsink, compute layer, PCB core, and shield separate, with callout annotations |
| 04 | Telemetry | Board reassembles; copper traces pulse with animated emissive glow (data flow) and a thermal heat map fades in |
| 05 | Spec Sheet | Camera pulls to a top-down view and the board docks next to the specs and dev kit call to action |

## Key features

- **Scroll-driven choreography**: one source of truth (`getStage`) maps scroll progress to every animated value in the scene.
- **Custom GLSL shaders**: animated signal traces (data-flow glow) and a thermal heat map.
- **Procedural geometry and textures**: instanced meshes for vias, passives, pins, and heatsink fins keep draw calls low.
- **Camera rig**: keyframed camera path with damping, subtle mouse parallax, and portrait/landscape-aware framing.
- **Loading screen**: full-screen loader with staged progress that fades out once the 3D scene and shaders are ready.
- **Floating HUD**: section navigation, scroll progress bar, and live offset readout.
- **Datasheet route**: `/datasheet` serves the product datasheet.
- **Responsive and accessible**: mobile-friendly layout, `aria` labels, and screen-reader text for the 3D canvas.

## Tech stack

**Framework and language**
- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/) 5.7

**3D and graphics**
- [three.js](https://threejs.org/) 0.186
- [@react-three/fiber](https://r3f.docs.pmnd.rs/) 9 (React renderer for three.js)
- [@react-three/drei](https://drei.docs.pmnd.rs/) 10 (Environment, Lightformer, Sparkles helpers)
- Custom GLSL vertex and fragment shaders

**Styling and UI**
- [Tailwind CSS](https://tailwindcss.com/) 4
- [shadcn/ui](https://ui.shadcn.com/) with [Base UI](https://base-ui.com/)
- `class-variance-authority`, `clsx`, `tailwind-merge`
- `tw-animate-css`
- [lucide-react](https://lucide.dev/) icons
- [Geist](https://vercel.com/font) Sans and Geist Mono (via `next/font`)

**Tooling and hosting**
- [pnpm](https://pnpm.io/) package manager
- PostCSS (`@tailwindcss/postcss`)
- [Vercel Analytics](https://vercel.com/analytics) (production only)
- Scaffolded with [v0](https://v0.app)

## Project structure

```
app/
  layout.tsx            Root layout, fonts, metadata
  page.tsx              Renders <Experience />
  globals.css           Tailwind + theme tokens
  datasheet/route.ts    Datasheet endpoint
components/
  experience.tsx        Page shell: scene + scroll container + HUD + loader
  loading-screen.tsx    Staged loading screen
  hud.tsx               Navigation, progress bar, readout
  OverlayUI.tsx         Scroll-synced HTML copy for each chapter
  telemetry-readout.tsx Live telemetry panel
  three/
    Scene.tsx           Canvas, lights, environment, ready signal
    RoboticsPCB.tsx     Board assembly and explode/dock choreography
    CameraRig.tsx       Keyframed camera + parallax
    signal-traces.tsx   Animated data-flow trace shader
    thermal-map.tsx     Heat map shader
    bench-grid.tsx      Lab bench floor
    annotation.tsx      3D callout labels
    pcb-primitives.tsx  Instanced boxes, materials, labels
lib/
  choreography.ts       Scroll progress -> scene state
  scroll-store.ts       Bridge between DOM scroll and R3F (no re-renders)
  pcb-layout.ts         Board dimensions, chips, hotspots
  procedural-textures.ts Procedural textures + seeded RNG
```

## Getting started

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm start      # serve the production build
```

## How it works

1. The page scrolls inside a native DOM container (`OverlayUI`) layered over a full-screen R3F `<Canvas>`.
2. `scroll-store.ts` reads the container's scroll progress and damps it into `scrollState.offset`, read inside `useFrame` loops without triggering React renders.
3. `choreography.ts` converts that offset into stage values (lift, explode, annotate, telemetry, dock) that every 3D component consumes.
4. `CameraRig` interpolates between camera keyframes along the same offset.

## Browser support

Requires a browser with WebGL 2 (current Chrome, Edge, Firefox, and Safari). A GPU-accelerated device is recommended for smooth 60 fps.

## License

All rights reserved. AETHER Robotics and AETHER-X5 are fictional names used for demonstration purposes.