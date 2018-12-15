const Rainbow = require('..')

const colors = [
    [255, 0, 0],
    [0, 255, 0],
    [0, 0, 255],
    [255, 255, 255]
]

const TIMER = 1000


const rainbow = new Rainbow({leds: 60, host: 'rainbow.local', port: 800})

let timer
let j = 0

rainbow.once('ready', () => {
    console.log('rainbow connected')
    timer = setInterval(() => {
        j++
        rainbow.setLeds(...colors[j % colors.length])
    }, TIMER);
})
rainbow.on('close', () => {
    console.log('rainbow close')
    clearInterval(timer);
})