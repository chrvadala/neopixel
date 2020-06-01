const NeoPixel = require('..')

const SERVER = process.env.SERVER || 'tcp://neopixel.local:800'
const PAUSE = process.env.PAUSE || 1000

const neopixel = new NeoPixel()

;(async () => {
  try {
    await neopixel.connect(SERVER)
    while (1) {
      const { latency } = await neopixel.fill({
        r: Math.round(Math.random() * 255),
        g: Math.round(Math.random() * 255),
        b: Math.round(Math.random() * 255)
      })
      console.log(`latency=${latency}ms`)
      await NeoPixel.wait(PAUSE - latency)
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
