/* global test, expect, jest */

jest.mock('net')

const TcpTransport = require('../src/TcpTransport')

test('connection open and close', async () => {
  expect.assertions(5)

  const transport = new TcpTransport(4)

  await expect(transport.connect('tcp://example.com:8080')).resolves.toBeUndefined()
  expect(transport.client.connect).toHaveBeenCalledWith(8080, 'example.com', expect.any(Function)) // net socket uses inverted order

  const client = transport.client
  await expect(transport.disconnect()).resolves.toBeUndefined()
  expect(client.end).toHaveBeenCalled()
  expect(transport.client).toBeUndefined()
})

test('outbound', () => {
  const transport = new TcpTransport(4)

  transport.connect('tcp://example.com:8080')

  transport.write(Buffer.from([0x00, 0x01, 0x02]))

  expect(transport.client.write).toHaveBeenLastCalledWith((Buffer.from([0x00, 0x01, 0x02])))
})

test('inbound 1 bit for packet with req frame set to 4', () => {
  expect.assertions(4)

  const onFrame = jest.fn()

  const transport = new TcpTransport(4)

  transport.connect('tcp://example.com:8080')
  transport.onFrame(onFrame)

  transport.client._simulateIncomingData(Buffer.from([0x00]))
  transport.client._simulateIncomingData(Buffer.from([0x01]))
  transport.client._simulateIncomingData(Buffer.from([0x02]))
  expect(onFrame).toHaveBeenCalledTimes(0)
  transport.client._simulateIncomingData(Buffer.from([0x03]))
  expect(onFrame).toHaveBeenLastCalledWith(Buffer.from([0x00, 0x01, 0x02, 0x03]))

  onFrame.mockClear()

  transport.client._simulateIncomingData(Buffer.from([0x04]))
  transport.client._simulateIncomingData(Buffer.from([0x05]))
  transport.client._simulateIncomingData(Buffer.from([0x06]))

  expect(onFrame).toHaveBeenCalledTimes(0)
  transport.client._simulateIncomingData(Buffer.from([0x07]))
  expect(onFrame).toHaveBeenLastCalledWith(Buffer.from([0x04, 0x05, 0x06, 0x07]))
})

test('inbound 6 bit for packet with req frame set to 4', () => {
  expect.assertions(3)

  const onFrame = jest.fn()

  const transport = new TcpTransport(4)

  transport.connect('tcp://example.com:8080')
  transport.onFrame(onFrame)

  transport.client._simulateIncomingData(Buffer.from([1, 2, 3, 4, 5, 6]))
  expect(onFrame).toHaveBeenLastCalledWith(Buffer.from([1, 2, 3, 4]))

  onFrame.mockClear()

  transport.client._simulateIncomingData(Buffer.from([7, 8, 9, 10, 11, 12]))
  expect(onFrame).toHaveBeenNthCalledWith(1, Buffer.from([5, 6, 7, 8]))
  expect(onFrame).toHaveBeenNthCalledWith(2, Buffer.from([9, 10, 11, 12]))
})
