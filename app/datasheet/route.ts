const DATASHEET = `AETHER ROBOTICS — AETHER-X1 NEURAL MOTION COMPUTE MODULE
Datasheet rev C · 2026
==========================================================

COMPUTE
  Neural processing unit ..... 120 TOPS INT8, 4nm
  Application CPU ............ 8x Cortex-A78AE @ 2.2 GHz
  Real-time core ............. 2x Cortex-R52 (lockstep)
  Memory ..................... 16 GB LPDDR5, 204 GB/s

MOTION & I/O
  Fieldbus ................... 2x EtherCAT (master), distributed clocks
  CAN ........................ 2x CAN-FD, 8 Mbit/s
  Motor drive ................ Dual 3-phase FOC, 48 V / 20 A per channel
  Control loop ............... up to 20 kHz, < 1 us sync jitter
  GPIO ....................... 2x20 header (SPI, I2C, UART, PWM)

SENSING
  IMU ........................ 6-axis, 8 kHz, hardware timestamped

POWER & THERMAL
  Input ...................... 12-48 V DC
  Typical draw ............... 25 W
  Efficiency ................. 4.8 TOPS/W
  Operating temperature ...... -40 to 85 C
  Cooling .................... CNC 6063 anodized aluminum heatsink

MECHANICAL
  Dimensions ................. 105 x 75 mm
  Board ...................... 12-layer HDI, 3 oz copper
  Shielding .................. Tin-plated steel EMI shield

SOFTWARE
  ROS 2 Jazzy (native), Zephyr RTOS on real-time core

Contact: enterprise@aether-robotics.com
`

export function GET() {
  return new Response(DATASHEET, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="AETHER-X1-datasheet.txt"',
    },
  })
}
