const Neopixel = require('./Neopixel')
const Protocol = require('./Protocol')

const fakeTransport = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  write: jest.fn(),
  onFrame: jest.fn(),
  _simulateFrame (buffer) {
    const calls = fakeTransport.onFrame.mock.calls
    const cb = calls[calls.length - 1][0]
    cb(buffer)
  }
}

test('connect with unavailable server', async () => {
  expect.assertions(1)

  const neopixel = new Neopixel()
  await expect(neopixel.connect('tcp://localhost:9999')).rejects.toEqual(expect.anything())
})

test('connect and disconnect', async () => {
  expect.assertions(4)

  fakeTransport.connect.mockImplementationOnce(() => {
    fakeTransport._simulateFrame(Buffer.from([Protocol.RES_CONN_ACK]))
  })

  const neopixel = new Neopixel()
  await expect(neopixel.connect(fakeTransport)).resolves.toBeUndefined()
  expect(fakeTransport.connect).toHaveBeenCalledTimes(1)

  await expect(neopixel.disconnect()).resolves.toBeUndefined()
  expect(fakeTransport.disconnect).toHaveBeenCalledTimes(1)
})

test('setPixels', async () => {
  expect.assertions(1)

  fakeTransport.connect.mockImplementationOnce(() => {
    fakeTransport._simulateFrame(Buffer.from([Protocol.RES_CONN_ACK]))
  })
  fakeTransport.write.mockImplementationOnce(() => {
    fakeTransport._simulateFrame(Buffer.from([Protocol.RES_APPLY_ACK]))
  })

  const neopixel = new Neopixel()
  const res = await neopixel.connect(fakeTransport)

  const res2 = await neopixel.setPixels([
    {led: 42, r: 1, g: 2, b: 3},
    {led: 43, red: 4, green: 5, blue: 6},
    {led: 44},
  ])

  expect(fakeTransport.write).toHaveBeenCalledWith(Buffer.concat([
    Protocol.set(Protocol.createOutboundFrame(), 0, 42, 1, 2, 3),
    Protocol.set(Protocol.createOutboundFrame(), 0, 43, 4, 5, 6),
    Protocol.set(Protocol.createOutboundFrame(), 0, 44, 0, 0, 0),
    Protocol.apply(Protocol.createOutboundFrame(), 0)
  ]))
})
