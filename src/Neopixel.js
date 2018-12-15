const net = require('net');
const EventEmitter = require('events')
const debug = require('debug')('rainbow')

const CMD_SHOW = 0x01
const CMD_SET_LED = 0x02
const CMD_SET_LEDS = 0x03
const CMD_SET_BRIGHTNESS = 0x04

const RES_CONN_ACK = 0x01
const RES_SHOW_ACK = 0x02

module.exports = class Rainbow extends EventEmitter {
  constructor({host, port, leds}) {
    super()
    this._leds = leds;
    this._showCbs = []

    this.client = new net.Socket();
    this.client.setNoDelay(true)
    this.client.on('data', data => {
      let msg = data.readUInt8(0)
      if (msg === RES_CONN_ACK) {
        debug('ready')
        this.emit('ready')
        return
      }

      if (msg === RES_SHOW_ACK) {
        let {cb, time} = this._showCbs.shift()
        if (cb) cb()
        debug('show_ack: latency %dms', Date.now() - time)
        return
      }

      debug('Received: ' + data.readUInt8(0));
    });

    this.client.on('error', () => {
      this.emit('error');
      console.error('Rainbow Error');
    })

    this.client.on('close', () => {
      debug('close')
      this.emit('close')
    })

    debug('connecting')
    this.client.connect(port, host, () => {
      debug('connect')
      this.setLeds(0, 0, 0)
    })
  }

  turnOff() {
    let size = this.size()
    for (let i = 0; i < size; i++) {
      this.setLed(i, 0, 0, 0)
    }
    this.show()
  }

  setLed(led, red, green, blue) {
    const b = Buffer.alloc(5)
    b.writeUInt8(CMD_SET_LED, 0)
    b.writeUInt8(led, 1)
    b.writeUInt8(red, 2)
    b.writeUInt8(green, 3)
    b.writeUInt8(blue, 4)
    this.client.write(b)
    this.log(`setLed(${led},${red},${green},${blue})`, b)
  }

  setBrightness(brightness) {
    const b = Buffer.alloc(5)
    b.writeUInt8(CMD_SET_BRIGHTNESS, 0)
    b.writeUInt8(brightness, 2)
    this.client.write(b)
    this.log(`setBrightness(${brightness})`, b)
  }

  show(cb) {
    const b = Buffer.alloc(5)
    b.writeUInt8(CMD_SHOW, 0)
    this.log('show()', b)
    this._showCbs.push({time: Date.now(), cb})
    this.client.write(b)
  }

  setLeds(red, green, blue, cb) {
    const b = Buffer.alloc(5)
    b.writeUInt8(CMD_SET_LEDS, 0)
    b.writeUInt8(red, 2)
    b.writeUInt8(green, 3)
    b.writeUInt8(blue, 4)
    this.log(`setLeds(${red},${green},${blue})`, b)
    this._showCbs.push({time: Date.now(), cb})
    this.client.write(b)
  }


  size() {
    return this._leds
  }

  log(desc, buffer) {
    if (!debug.enabled) return
    const hex = buffer.toString('hex')
    let c = ''
    for (let i = 0; i < hex.length; i += 2) {
      c += '\\x' + hex.substr(i, 2)
    }
    debug('desc:%s buffer: %s queue', desc, c, this.client.bufferSize)
  }

}
