const NeoPixel = require('..')

const SERVER = process.env.SERVER || 'tcp://neopixel.local:800'
const PAUSE = process.env.PAUSE || 1000

const COLORS = [
  { r: 255 },
  { g: 255 },
  { b: 255 },
  { r: 255, g: 255, b: 255 }
]

const neopixel = new NeoPixel()

;(async () => {
  try {
    await neopixel.connect(SERVER)
    let colorIndex = 0
    while (1) {
      const color = COLORS[colorIndex++ % COLORS.length]
      const { latency } = await neopixel.fill(color)
      await NeoPixel.wait(PAUSE - latency)
      console.log(`latency=${latency}ms`)
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
