module.exports = class BadType extends Error {
  constructor (msg) {
    super(msg)
    this.code = 'ERR_NEOPIXEL_BAD_TYPE'
  }
}
