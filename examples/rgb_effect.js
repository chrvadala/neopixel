const Rainbow = require('..')

const colors = [
  [255, 0, 0],
  [0, 255, 0],
  [0, 0, 255],
  [255, 255, 255]
]

const TIMER = 1000
const rainbow = new Rainbow()
const wait = ms => new Promise(done => setTimeout(done, ms));

(async () => {
  await rainbow.connect('tcp://rainbow.local:800')

  let j = 0
  while (true) {
    await Promise.all([
      wait(TIMER),
      rainbow.fill(...colors[j % colors.length]),
    ])
    j++
  }
})()
