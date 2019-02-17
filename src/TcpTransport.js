const { EventEmitter } = require('events')
const { Socket } = require('net')
const { URL } = require('url')
const debug = require('debug')('neopixel:TcpTransport')

class TcpTransport extends EventEmitter {
  constructor (inboundFrameSize) {
    super()

    this.client = undefined
    this.data = Buffer.alloc(0)

    this.inboundFrameSize = inboundFrameSize
  }

  connect (url) {
    this.url = new URL(url)

    if (this.url.protocol !== 'tcp:') throw new Error('Unsupported protocol')

    return new Promise((resolve, reject) => {
      this.client = new Socket()
      this.client.setNoDelay(true)

      this.client.on('error', err => {
        debug('error', err.message)
        reject(err)
      })

      this.client.on('data', data => {
        debug('data', data)
        this._handleData(data)
      })

      debug('connecting')
      this.client.connect(parseInt(this.url.port), this.url.hostname, () => {
        debug('connect', this.url)
        resolve()
      })
    })
  }

  disconnect () {
    debug('disconnecting')
    if (!this.client) throw new Error('Client is not ready')
    return new Promise(resolve => {
      this.client.end(() => {
        debug('disconnect')
        resolve()
      })
      this.client = undefined
    })
  }

  write (buffer) {
    if (!this.client) throw new Error('Client is not ready')
    debug('write', buffer)
    this.client.write(buffer)
  }

  onFrame (cb) {
    this.on('frame', cb)
  }

  _handleData (incomingData) {
    const frameSize = this.inboundFrameSize

    if (!this.client) throw new Error('Client is not ready')
    const data = Buffer.concat([
      this.data,
      incomingData
    ], this.data.length + incomingData.length)

    let toConsume = 0
    for (let i = 0; i < data.length; i += frameSize) {
      let slice = data.slice(i, i + frameSize)
      if (slice.length === frameSize) {
        toConsume = i + frameSize
        debug('frame', slice)
        this.emit('frame', slice)
      }
    }
    this.data = data.slice(toConsume)
  }
}

module.exports = TcpTransport
