/* global beforeEach, describe, test, expect, jest */

const NeoPixel = require('./NeoPixel')
const Protocol = require('./Protocol')
const WrongFeedback = require('./WrongFeedback')
const BadType = require('./BadType')

const fakeTransport = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  write: jest.fn(),
  onFrame: jest.fn(),
  _simulateIncomingFrame (buffer) {
    const calls = fakeTransport.onFrame.mock.calls
    const cb = calls[calls.length - 1][0]
    setTimeout(() => {
      cb(buffer)
    }, 100)
  }
}

test('connect with unavailable server', async () => {
  expect.assertions(1)

  const neopixel = new NeoPixel()
  await expect(neopixel.connect('tcp://localhost:9999')).rejects.toEqual(expect.anything())
})

test('connect and disconnect', async () => {
  expect.assertions(4)

  fakeTransport.connect.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_CONN_ACK, 54321, 54321 >> 8, 0]))
  })

  const neopixel = new NeoPixel()
  await expect(neopixel.connect(fakeTransport)).resolves.toEqual({ latency: expect.any(Number), pixels: 54321 })
  expect(fakeTransport.connect).toHaveBeenCalledTimes(1)

  await expect(neopixel.disconnect()).resolves.toBeUndefined()
  expect(fakeTransport.disconnect).toHaveBeenCalledTimes(1)
})

test('setPixels', async () => {
  expect.assertions(2)

  fakeTransport.connect.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_CONN_ACK, 0, 0, 0]))
  })
  fakeTransport.write.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_APPLY_ACK, 0, 0, 0]))
  })

  const neopixel = new NeoPixel()
  await neopixel.connect(fakeTransport)

  await neopixel.setPixels([
    { p: 42, r: 1, g: 2, b: 3 },
    { pixel: 43, red: 4, green: 5, blue: 6 },
    {} // like {l: 0, r: 0, g: 0, b: 0}
  ])

  expect(fakeTransport.write).toHaveBeenCalledWith(Buffer.concat([
    Protocol.set(Protocol.createOutboundFrame(), 0, 42, 1, 2, 3),
    Protocol.set(Protocol.createOutboundFrame(), 0, 43, 4, 5, 6),
    Protocol.set(Protocol.createOutboundFrame(), 0, 0, 0, 0, 0),
    Protocol.apply(Protocol.createOutboundFrame(), 0)
  ]))

  await expect(neopixel.setPixels({ l: 42, r: 1, g: 2, b: 3 })).rejects.toBeInstanceOf(BadType)
})

test('setPixels with reset', async () => {
  expect.assertions(1)

  fakeTransport.connect.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_CONN_ACK, 0, 0, 0]))
  })
  fakeTransport.write.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_OFF_ACK, 0, 0, 0]))
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_APPLY_ACK, 0, 0, 0]))
  })

  const neopixel = new NeoPixel()
  await neopixel.connect(fakeTransport)

  await neopixel.setPixels([
    { p: 42, r: 1, g: 2, b: 3 },
    { pixel: 43, red: 4, green: 5, blue: 6 },
    {} // like {l: 0, r: 0, g: 0, b: 0}
  ], true)

  expect(fakeTransport.write).toHaveBeenCalledWith(Buffer.concat([
    Protocol.off(Protocol.createOutboundFrame(), 0),
    Protocol.set(Protocol.createOutboundFrame(), 0, 42, 1, 2, 3),
    Protocol.set(Protocol.createOutboundFrame(), 0, 43, 4, 5, 6),
    Protocol.set(Protocol.createOutboundFrame(), 0, 0, 0, 0, 0),
    Protocol.apply(Protocol.createOutboundFrame(), 0)
  ]))
})

test('fill', async () => {
  expect.assertions(3)

  fakeTransport.connect.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_CONN_ACK, 0, 0, 0]))
  })
  fakeTransport.write.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_FILL_ACK, 0, 0, 0]))
  })

  const neopixel = new NeoPixel()
  await neopixel.connect(fakeTransport)

  await neopixel.fill({ red: 1, green: 2, blue: 3 })
  expect(fakeTransport.write).toHaveBeenCalledWith(
    Protocol.fill(Protocol.createOutboundFrame(), 0, 1, 2, 3)
  )

  await neopixel.fill({ r: 1, g: 2, b: 3 })
  expect(fakeTransport.write).toHaveBeenCalledWith(
    Protocol.fill(Protocol.createOutboundFrame(), 0, 1, 2, 3)
  )

  await neopixel.fill({})
  expect(fakeTransport.write).toHaveBeenCalledWith(
    Protocol.fill(Protocol.createOutboundFrame(), 0, 0, 0, 0)
  )
})

test('off', async () => {
  expect.assertions(1)

  fakeTransport.connect.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_CONN_ACK, 0, 0, 0]))
  })
  fakeTransport.write.mockImplementation(() => {
    fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_OFF_ACK, 0, 0, 0]))
  })

  const neopixel = new NeoPixel()
  await neopixel.connect(fakeTransport)

  await neopixel.off()

  expect(fakeTransport.write).toHaveBeenCalledWith(
    Protocol.off(Protocol.createOutboundFrame(), 0)
  )
})

describe('test incoming frame feedback', () => {
  let neopixel
  beforeEach(async () => {
    jest.resetAllMocks()
    fakeTransport.connect.mockImplementation(() => {
      fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_CONN_ACK, 0, 0, 0]))
    })

    neopixel = new NeoPixel()
    await neopixel.connect(fakeTransport)
  })

  describe('setPixels', () => {
    const cmd = () => neopixel.setPixels([{ l: 100, r: 255, g: 255, b: 255 }])

    test('with GOOD feedback', async () => {
      expect.assertions(1)
      fakeTransport.write.mockImplementation(() => {
        fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_APPLY_ACK, 0, 0, 0]))
      })
      await expect(cmd()).resolves.toEqual({ latency: expect.any(Number) })
    })

    test('with WRONG feedback', async () => {
      expect.assertions(1)
      fakeTransport.write.mockImplementation(() => {
        fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_FILL_ACK, 0, 0, 0]))
      })
      await expect(cmd()).rejects.toBeInstanceOf(WrongFeedback)
    })
  })

  describe('fill', () => {
    const cmd = () => neopixel.fill({ r: 255, g: 255, b: 255 })

    test('with GOOD feedback', async () => {
      expect.assertions(1)
      fakeTransport.write.mockImplementation(() => {
        fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_FILL_ACK, 0, 0, 0]))
      })
      await expect(cmd()).resolves.toEqual({ latency: expect.any(Number) })
    })

    test('with WRONG feedback', async () => {
      expect.assertions(1)
      fakeTransport.write.mockImplementation(() => {
        fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_CONN_ACK, 0, 0, 0]))
      })
      await expect(cmd()).rejects.toBeInstanceOf(WrongFeedback)
    })
  })

  describe('off', () => {
    const cmd = () => neopixel.off()

    test('with GOOD feedback', async () => {
      expect.assertions(1)
      fakeTransport.write.mockImplementation(() => {
        fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_OFF_ACK, 0, 0, 0]))
      })
      await expect(cmd()).resolves.toEqual({ latency: expect.any(Number) })
    })

    test('with WRONG feedback', async () => {
      expect.assertions(1)
      fakeTransport.write.mockImplementation(() => {
        fakeTransport._simulateIncomingFrame(Buffer.from([Protocol.RES_CONN_ACK, 0, 0, 0]))
      })
      await expect(cmd()).rejects.toBeInstanceOf(WrongFeedback)
    })
  })
})
