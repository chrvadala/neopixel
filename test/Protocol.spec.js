/* global test, expect */

const Protocol = require('../src/Protocol')

const PLACEHOLDER = 9 // used to fill the buffer

test('apply', () => {
  const b = Buffer.alloc(Protocol.outboundFrameSize() + 4, PLACEHOLDER)

  expect(Protocol.apply(b, 2))
    .toEqual(Buffer.from([
      PLACEHOLDER, PLACEHOLDER,
      0x01, 0, 0, 0, 0, 0,
      PLACEHOLDER, PLACEHOLDER
    ]))
})

test('set', () => {
  const b = Buffer.alloc(Protocol.outboundFrameSize() + 4, PLACEHOLDER)

  const n = Buffer.alloc(2)
  n.writeUInt16LE(42, 0)

  expect(Protocol.set(b, 2, 42, 101, 102, 103))
    .toEqual(Buffer.from([
      PLACEHOLDER, PLACEHOLDER,
      0x02, ...n.values(), 101, 102, 103,
      PLACEHOLDER, PLACEHOLDER
    ]))

  n.writeUInt16LE(1000, 0)
  expect(Protocol.set(b, 2, 1000, 101, 102, 103))
    .toEqual(Buffer.from([
      PLACEHOLDER, PLACEHOLDER,
      0x02, ...n.values(), 101, 102, 103,
      PLACEHOLDER, PLACEHOLDER
    ]))
})

test('fill', () => {
  const b = Buffer.alloc(Protocol.outboundFrameSize() + 4, PLACEHOLDER)

  expect(Protocol.fill(b, 2, 101, 102, 103))
    .toEqual(Buffer.from([
      PLACEHOLDER, PLACEHOLDER,
      0x03, 0, 0, 101, 102, 103,
      PLACEHOLDER, PLACEHOLDER
    ]))
})

test('off', () => {
  const b = Buffer.alloc(Protocol.outboundFrameSize() + 4, PLACEHOLDER)
  expect(Protocol.off(b, 2))
    .toEqual(Buffer.from([
      PLACEHOLDER, PLACEHOLDER,
      0x04, 0, 0, 0, 0, 0,
      PLACEHOLDER, PLACEHOLDER
    ]))
})

test('decodeFrame', () => {
  const buffer = Buffer.alloc(4)
  buffer[0] = 0x01
  buffer.writeUInt16LE(12345, 1)

  expect(Protocol.decodeFrame(buffer))
    .toEqual({ ack: 'connect', pixels: 12345 })

  expect(Protocol.decodeFrame(Buffer.from([0x02, 0, 0, 0])))
    .toEqual({ ack: 'apply' })
})

test('in/outFrameSize', () => {
  expect(Protocol.inboundFrameSize()).toEqual(4)
  expect(Protocol.outboundFrameSize()).toEqual(6)
  expect(Protocol.createOutboundFrame()).toEqual(Buffer.alloc(6, 0))
  expect(Protocol.createOutboundFrame(3)).toEqual(Buffer.alloc(6 * 3, 0))
})
