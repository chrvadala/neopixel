const NeoPixel = require('..')

const SERVER = process.env.SERVER || 'tcp://neopixel.local:800'
const PAUSE = process.env.PAUSE || 1000

const COLORS = [
  { r: 255 },
  { r: 255 * 0.5 },
  { r: 255 * 0.3 },
  { r: 255 * 0.1 },
  {},
  {},
  { g: 255 },
  { g: 255 * 0.5 },
  { g: 255 * 0.3 },
  { g: 255 * 0.1 },
  {},
  {},
  { b: 255 },
  { b: 255 * 0.5 },
  { b: 255 * 0.3 },
  { b: 255 * 0.1 },
  {},
  {}
]
const neopixel = new NeoPixel()

;(async () => {
  try {
    await neopixel.connect(SERVER)

    let colorIndex = 0

    while (1) {
      const colors = []
      for (let pixel = 0; pixel < neopixel.pixels; pixel++) {
        const color = COLORS[(colorIndex + pixel) % COLORS.length]
        colors.push({ pixel, ...color })
      }

      const { latency } = await neopixel.setPixels(colors, true)
      console.log(`latency=${latency}ms`)
      await NeoPixel.wait(PAUSE - latency)
      colorIndex = ++colorIndex % COLORS.length
    }
  } catch (e) {
    console.error(`Error occurred: [${e.code}] ${e.message}`)
    process.exit(1)
  }
})()

process.on('SIGINT', async () => {
  console.log('Caught interrupt signal')
  try {
    await Promise.race([
      neopixel.off(),
      NeoPixel.wait(10 * 1000)
    ])
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})
