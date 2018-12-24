const net = require('net')
const EventEmitter = require('events')
const debug = require('debug')('rainbow')
const TcpTransport = require('./TcpTransport')
const Protocol = require('./Protocol')

class Neopixel extends EventEmitter {
  constructor () {
    super()

    this.transport = undefined
    this.cbs = []
  }

  async connect (urlOrTransport) {
    switch (typeof urlOrTransport) {
      case 'string':
        this.transport = new TcpTransport()
        break

      case 'object':
        this.transport = urlOrTransport
        break

      default:
        throw new Error('Unsupported connection type')
    }

    this.transport.onFrame(this._handleFrame.bind(this))

    const [, res] = await Promise.all([
      new Promise(done => this.cbs.push({time: Date.now(), done})),
      this.transport.connect(urlOrTransport),
    ])

    return res
  }

  async disconnect () {
    await this.transport.disconnect()
  }

  setPixels (pixels) {
    return new Promise(done => {
      let buffer = Buffer.alloc(Protocol.outboundFrameSize() * (pixels.length + 1), 0)
      let offset = 0
      for (const {led, red, r, green, g, blue, b} of pixels) {
        Protocol.set(
          buffer, offset,
          led,
          red || r || 0,
          green || g || 0,
          blue || b || 0
        )
        offset += Protocol.outboundFrameSize()
      }
      Protocol.apply(buffer, offset)
      this.cbs.push({time: Date.now(), done})
      this.transport.write(buffer)
    })
  }

  fill (red, green, blue) {
    return new Promise(done => {
      let buffer = Buffer.alloc(0, Protocol.outboundFrameSize())
      Protocol.fill(buffer, 0, red, green, blue)

      this.cbs.push({time: Date.now(), done})
      this.transport.write(buffer)
    })
  }

  off () {
    return new Promise(done => {
      let buffer = Buffer.alloc(0, Protocol.outboundFrameSize())
      Protocol.fill(buffer, 0)

      this.cbs.push({time: Date.now(), done})
      this.transport.write(buffer)
    })
  }

  _handleFrame (frame) {
    const decodedFrame = Protocol.decodeFrame(frame)
    let {time, done} = this.cbs.shift()
    done({...frame, latency: Date.now() - time})
  }
}

module.exports = Neopixel