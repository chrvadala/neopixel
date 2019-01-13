const NeoPixel = require('..')

const PIXELS = 60
const PAUSE = 20
const COLORS = [
  { r: 255, g: 0, b: 0 },
  { r: 0, g: 255, b: 0 },
  { r: 0, g: 0, b: 255 },
  { r: 255, g: 255, b: 255 }
]

const neopixel = new NeoPixel()
const wait = ms => new Promise(done => setTimeout(done, Math.max(ms, 0)));// eslint-disable-line

(async () => {
  try {
    await neopixel.connect('tcp://neopixel.local:800')

    let colorIndex = 0
    let prevPixel = 0
    let curPixel = 0

    while (1) {
      let color = COLORS[colorIndex % COLORS.length]
      const { latency } = await neopixel.setPixels([
        { pixel: prevPixel }, // turnoff prev curPixel
        { pixel: curPixel, ...color }
      ])
      console.log(`latency=${latency}ms`)
      await wait(PAUSE - latency)
      prevPixel = curPixel
      curPixel++
      if (curPixel >= PIXELS) {
        curPixel = 0
        colorIndex++
      }
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
