const {EventEmitter} = require('events')

class Socket extends EventEmitter {
  constructor () {
    super()

    this.connect = jest.fn((port, host, cb) => setTimeout(cb))
    this.setNoDelay = jest.fn()
    this.end = jest.fn(cb => setTimeout(cb))
    this.write = jest.fn()
  }

  _simulateIncomingData (buffer) {
    this.emit('data', buffer)
  }
}

module.exports = {Socket}