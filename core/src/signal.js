export default class Signal {
  _waiting = null
  _data = []

  transmit(buffer) {
    if (!this._waiting) {
      this._data.push(buffer)
      return this
    }

    this._waiting(buffer)
    this._waiting = null
    return this
  }

  async receive() {
    if (this._data.length) {
      return this._data.shift()
    }

    return new Promise(resolve =>
      this._waiting = resolve)
  }

  end() {
    this.ended = () =>
      !this._data.length
    return this
  }

  ended() {
    return false
  }
}