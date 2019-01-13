const EventEmitter = require('events')
const debug = require('debug')('neopixel:Neopixel')
const TcpTransport = require('./TcpTransport')
const Protocol = require('./Protocol')
const WrongFeedback = require('./WrongFeedback')
const BadType = require('./BadType')

class NeoPixel extends EventEmitter {
  constructor () {
    super()

    this.transport = undefined
    this.cbs = []
  }

  async connect (urlOrTransport) {
    switch (typeof urlOrTransport) {
      case 'string':
        this.transport = new TcpTransport(Protocol.inboundFrameSize())
        break

      case 'object':
        this.transport = urlOrTransport
        break

      default:
        throw new Error('Unsupported connection type')
    }

    this.transport.onFrame(this._handleFrame.bind(this))

    const [res] = await Promise.all([
      new Promise((resolve, reject) => this.cbs.push({
        time: Date.now(),
        ack: 'connect',
        resolve,
        reject
      })),
      this.transport.connect(urlOrTransport)
    ])

    return res
  }

  async disconnect () {
    await this.transport.disconnect()
  }

  setPixels (arrayOfColors, reset = false) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now()
      if (!Array.isArray(arrayOfColors)) return reject(new BadType('setPixels accepts only arrays'))

      let buffer = Protocol.createOutboundFrame(arrayOfColors.length + 1 + (reset ? 1 : 0))
      let offset = 0

      if (reset) {
        Protocol.off(buffer, offset)
        offset += Protocol.outboundFrameSize()
        this.cbs.push({ time: Date.now(), ack: 'off', resolve: () => {}, reject })
      }

      for (const { pixel, p, red, r, green, g, blue, b } of arrayOfColors) {
        Protocol.set(
          buffer, offset,
          pixel || p || 0,
          red || r || 0,
          green || g || 0,
          blue || b || 0
        )
        offset += Protocol.outboundFrameSize()
      }
      Protocol.apply(buffer, offset)
      this.cbs.push({ time: startTime, ack: 'apply', resolve, reject })
      this.transport.write(buffer)
    })
  }

  fill (color) {
    return new Promise((resolve, reject) => {
      let buffer = Protocol.createOutboundFrame()
      const { red, r, green, g, blue, b } = color
      Protocol.fill(
        buffer, 0,
        red || r || 0,
        green || g || 0,
        blue || b || 0
      )
      this.cbs.push({ time: Date.now(), ack: 'fill', resolve, reject })
      this.transport.write(buffer)
    })
  }

  off () {
    return new Promise((resolve, reject) => {
      let buffer = Protocol.createOutboundFrame()
      Protocol.off(buffer, 0)

      this.cbs.push({ time: Date.now(), ack: 'off', resolve, reject })
      this.transport.write(buffer)
    })
  }

  _handleFrame (frame) {
    const { ack: receivedAck } = Protocol.decodeFrame(frame)
    const { time, ack: expectedAck, resolve, reject } = this.cbs.shift()
    const latency = Date.now() - time
    debug('latency %d ms', latency)
    if (receivedAck === expectedAck) {
      resolve({ latency })
    } else {
      debug('WrongFeedback received: %s, expected: %s', receivedAck, expectedAck)
      reject(new WrongFeedback())
    }
  }
}

module.exports = NeoPixel
