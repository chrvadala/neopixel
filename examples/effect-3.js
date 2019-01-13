const NeoPixel = require('..')

const PIXELS = 60
const PAUSE = 100
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
const wait = ms => new Promise(done => setTimeout(done, Math.max(ms, 0)));// eslint-disable-line

(async () => {
  try {
    await neopixel.connect('tcp://neopixel.local:800')

    let colorIndex = 0

    while (1) {
      let colors = []
      for (let pixel = 0; pixel < PIXELS; pixel++) {
        const color = COLORS[(colorIndex + pixel) % COLORS.length]
        colors.push({ pixel, ...color })
      }

      const { latency } = await neopixel.setPixels(colors, true)
      console.log(`latency=${latency}ms`)
      await wait(PAUSE - latency)
      colorIndex = ++colorIndex % COLORS.length
    }
  } catch (e) {
    console.error(`Error occurred: [${e.code}] ${e.message}`)
    process.exit(1)
  }
})()

process.on('SIGINT', async () => {
  console.log('Caught interrupt signal')

  await Promise.race([
    neopixel.off(),
    wait(10000)
  ])
  process.exit(0)
})
