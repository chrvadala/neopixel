const NeoPixel = require('..')

const SERVER = process.env.SERVER || 'tcp://neopixel.local:800'
const PAUSE = parseInt(process.env.PAUSE) || 1000

const neopixel = new NeoPixel()

;(async () => {
  try {
    const { pixels } = await neopixel.connect(SERVER)
    console.log('PIXELS ' + pixels)

    let pixel = 0
    while (1) {
      pixel = ++pixel % neopixel.pixels
      const { latency } = await neopixel.setPixels([{ pixel, r: 255, g: 0, b: 0 }], true)
      console.info(`latency=${latency}ms`)
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
