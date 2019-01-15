const wait = ms => new Promise(done => setTimeout(done, Math.max(ms, 0)))// eslint-disable-line
const NeoPixel = require('..')

const neopixel = new NeoPixel();

(async () => {
  try {
    const PAUSE = 1000

    await neopixel.connect('tcp://neopixel.local:800')
    console.log('PIXELS ' + neopixel.pixels)

    let pixel = 0
    while (1) {
      pixel = ++pixel % neopixel.pixels
      const { latency } = await neopixel.setPixels([{ pixel, r: 255, g: 0, b: 0 }], true)
      console.info(`latency=${latency}ms`)
      await wait(PAUSE)
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
