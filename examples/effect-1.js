const wait = ms => new Promise(done => setTimeout(done, Math.max(ms, 0)))
const NeoPixel = require('..');

(async () => {
  try {
    const PIXELS = 60
    const PAUSE = 1000

    const neopixel = new NeoPixel()
    await neopixel.connect('tcp://neopixel.local:800')

    let pixel = 0
    while (1) {
      pixel = ++pixel % PIXELS
      const {latency} = await neopixel.setPixels([{pixel, r: 255, g: 0, b: 0}], true)
      console.info(`latency=${latency}ms`)
      await wait(PAUSE)
    }

    process.on('SIGINT', async () => {
      console.log('Caught interrupt signal')

      await Promise.race([
        neopixel.off(),
        wait(10000),
      ])
      process.exit(0)
    })

  } catch (e) {
    console.error(`Error occurred: [${e.code}] ${e.message}`)
    process.exit(1)
  }

})()

