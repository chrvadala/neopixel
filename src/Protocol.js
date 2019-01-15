const SIZE_IN_FRAME = 4
const SIZE_OUT_FRAME = 5

const CMD_SET = 0x01
const CMD_APPLY = 0x02
const CMD_FILL = 0x03
const CMD_OFF = 0x04

const RES_CONN_ACK = 0x01
const RES_APPLY_ACK = 0x02
const RES_FILL_ACK = 0x03
const RES_OFF_ACK = 0x04

class Protocol {
  static set (buffer, offset, led, red, green, blue) {
    buffer.writeUInt8(CMD_SET, offset)
    buffer.writeUInt8(led, offset + 1)
    buffer.writeUInt8(red, offset + 2)
    buffer.writeUInt8(green, offset + 3)
    buffer.writeUInt8(blue, offset + 4)
    return buffer
  }

  static apply (buffer, offset) {
    buffer.writeUInt8(CMD_APPLY, offset)
    buffer.fill(0, offset + 1, offset + 1 + 4)
    return buffer
  }

  static fill (buffer, offset, red, green, blue) {
    buffer.writeUInt8(CMD_FILL, offset)
    buffer.writeUInt8(0x00, offset + 1)
    buffer.writeUInt8(red, offset + 2)
    buffer.writeUInt8(green, offset + 3)
    buffer.writeUInt8(blue, offset + 4)
    return buffer
  }

  static off (buffer, offset) {
    buffer.writeUInt8(CMD_OFF, offset)
    buffer.fill(0, offset + 1, offset + 1 + 4)
    return buffer
  }

  static decodeFrame (frame) {
    let msg = frame.readUInt8(0)
    switch (msg) {
      case RES_CONN_ACK:
        return { ack: 'connect', pixels: frame.readUInt16LE(1) }

      case RES_APPLY_ACK:
        return { ack: 'apply' }

      case RES_FILL_ACK:
        return { ack: 'fill' }

      case RES_OFF_ACK:
        return { ack: 'off' }

      default:
        throw new Error('Unrecognized error')
    }
  }

  static inboundFrameSize () {
    return SIZE_IN_FRAME
  }

  static outboundFrameSize () {
    return SIZE_OUT_FRAME
  }

  static createOutboundFrame (frames = 1) {
    return Buffer.alloc(Protocol.outboundFrameSize() * frames, 0)
  }
}

Protocol.CMD_SET = CMD_SET
Protocol.CMD_APPLY = CMD_APPLY
Protocol.CMD_FILL = CMD_FILL
Protocol.CMD_OFF = CMD_OFF

Protocol.RES_CONN_ACK = RES_CONN_ACK
Protocol.RES_APPLY_ACK = RES_APPLY_ACK
Protocol.RES_FILL_ACK = RES_FILL_ACK
Protocol.RES_OFF_ACK = RES_OFF_ACK

module.exports = Protocol
