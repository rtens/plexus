import Signal from './signal.js'

export default class Node {
  _cells = []
  _links = []
  _received = {}
  _receivers = {}
  _buffer = {}

  add(cell) {
    this._cells.push(cell)
    return cell
  }

  attach(link) {
    this._links.push(link)
    link.receive = packet => this.receive(packet, link)
    return link
  }

  on_error(_error) { }

  async receive(packet, source) {
    if (this._already_received(packet)) return

    return Promise.all([
      ...this._forward(packet, source),
      ...this._distribute(packet)])
  }

  _already_received(packet) {
    const key = packet.identifier + '.' + packet.index

    if (key in this._received) return true
    this._received[key] = true

    return false
  }

  _forward(packet, source) {
    return this._links
      .filter(link => link != source)
      .map(link => link.send(packet)
        .catch(e => this.on_error(e)))
  }

  _distribute(packet) {
    const done = []
    const id = packet.identifier

    if (!(id in this._receivers)) {
      this._buffer[id] = []
      this._detect(id, done)
    }

    this._buffer[id].push(packet)
    this._receive(id, packet)

    return done
  }

  _detect(id, done) {
    this._receivers[id] = { next: 0, signals: [] }

    for (const cell of this._cells) {
      const signal = new Signal()
      this._receivers[id].signals.push(signal)
      done.push(cell.detect(signal)
        .catch(e => this.on_error(e)))
    }
  }

  _receive(id) {
    while (true) {
      const next = this._buffer[id].findIndex(p =>
        p.index == this._receivers[id].next)
      if (next == -1) return

      const packet = this._buffer[id][next]
      this._buffer[id].splice(next, 1)

      this._receivers[id].next++
      for (const signal of this._receivers[id].signals) {
        signal.transmit(packet.content)
        if (packet.final) signal.end()
      }
    }
  }
}