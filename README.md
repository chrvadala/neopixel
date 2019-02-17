# NeoPixel
This library enables the **Adafruit NeoPixel** control from a **Node.js** script through a **TCP connection**.

The *server* side has to be installed on an **ESP8266/Arduino** (or compatible) board.   
The *client* side can work on any machine that runs Node.js.


## Requirements
- **ESP8266** or compatible board, available here https://amzn.to/2Vpm3C8#esp8266
- A NeoPixel strip led, available here https://amzn.to/2AuuZNQ#neopixel-strip-led
- A power supply that supports 5V and 18watt (depends on number of pixels), available here https://amzn.to/2SFMTo1#power-supply-5v-18w
- A jack for DC connections, available here https://amzn.to/2RaNGQT#jack-dc


## Setup
- **Upload the firmware on the ESP8266**.     
To do this you can use the Board Manager available in the Arduino software.   
Follow this instructions https://arduino-esp8266.readthedocs.io/en/latest/installing.html

- **Wire the strip with the ESP8266**.    
Connect the Strip Led and the ESP8266 to a power supply and the DATAIN pin with the D1 pin.     
More details are available here https://learn.adafruit.com/adafruit-neopixel-uberguide/basic-connections   

- **Connect your ESP8266 on your local network**.     
Turn on your ESP8266. You should see an Access Point that has `neopixel` as SSID name.     
Connect on it, then you should see a captive portal that asks your Wi-Fi credentials.     
Provide it and then try to ping on your local network `neopixel.local`. You should be able to see this device connected and announced through Bonjour.     
More details about the Wi-Fi configuration are available here https://github.com/tzapu/WiFiManager#how-it-works.    
More details about the service discovery are available here https://github.com/esp8266/Arduino/tree/master/libraries/ESP8266mDNS#requirements.

## Example
```javascript
const NeoPixel = require('neopixel');

const SERVER = process.env['SERVER'] || 'tcp://neopixel.local:800'
const PAUSE = parseInt(process.env['PAUSE']) || 1000

const neopixel = new NeoPixel()

;(async () => {
  try {
    let { pixels } = await neopixel.connect(SERVER)
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
```



## Reference
### `new NeoPixel()` 
  ```javascript
const NeoPixel = require('neopixel')
const neopixel = new NeoPixel()
```

### `connect(tcpUri)` 
Connects client with the board and returns number of configured pixels.   
```javascript
const {latency, pixels} = await neopixel.connect('tcp://neopixel.local:800')
```    

### `setPixels(arrayOfColors, reset=false)`
Sets pixel colors. If reset, any other pixel is turned off.
```javascript
const {latency} = await neopixel.setPixels([
    {pixel: 10, red: 255, green: 0, blue: 0},
    {pixel: 20, red: 0, green: 255, blue: 0},
], true)

// shorthand version
const {latency} = await neopixel.setPixels([
    {p: 10, r: 255, g: 0, b: 0},
    {p: 20, r: 0, g: 255, b: 0},
], true)
```
### `fill(color)`
Sets every pixel with the same color.  
```javascript
const {latency} = await neopixel.fill({red: 255, green: 0, blue: 0})

// shorthand version
const {latency} = await neopixel.fill({r: 255, g: 0, b: 0})
```

### `off()`
Turn of every pixel.  
```javascript
const {latency} = await neopixel.off()
```