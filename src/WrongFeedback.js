module.exports = class WrongFeedback extends Error {
  constructor () {
    super()
    this.code = 'ERR_NEOPIXEL_WRONG_FEEDBACK'
    this.msg = 'Reiceved an unexpected frame'
  }
}
