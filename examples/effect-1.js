const NeoPixel = require('..')

const PAUSE = 1000
const COLORS = [
  {r: 255, g: 0, b: 0},
  {r: 0, g: 255, b: 0},
  {r: 0, g: 0, b: 255},
  {r: 255, g: 255, b: 255},
]

const neopixel = new NeoPixel()
const wait = ms => new Promise(done => setTimeout(done, Math.max(ms, 0)));

(async () => {
  try {
    await neopixel.connect('tcp://neopixel.local:800')

    let j = 0
    while (1) {
      const {latency} = await neopixel.fill(COLORS[j % COLORS.length])
      console.log(`latency=${latency}ms`)
      await wait(PAUSE - latency)
      j++
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
    wait(10000),
  ])
  process.exit(0)
})