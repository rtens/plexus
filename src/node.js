import crypto from 'crypto'
import Sig from './sig.js'

const start = Buffer.from('11', 'hex')
const esc = Buffer.from('12', 'hex')
const end = Buffer.from('13', 'hex')

export default class Node {

  constructor(plex) {
    this.plex = plex
    plex.emit = sig =>
      this.send(sig)

    this.links = []
    this.received = {}
    this.parser = new Parser()
  }

  attach(link) {
    this.links.push(link)
    link.receive = packet =>
      this.receive(packet, link)
    return link
  }

  send(sig) {
    const packet = Buffer.concat([
      start,
      start, this.generate_id(), end,
      this.pack(sig),
      end
    ])

    this.links.forEach(link =>
      link.send(packet))
  }

  generate_id() {
    return crypto.randomBytes(8)
  }

  receive(packet, receiver) {
    this.unpack(packet, sig => {
      this.plex.bind(sig)
      this.links
        .filter(l => l != receiver)
        .forEach(l => l.send(packet))
    })
  }

  pack(sig) {
    if (sig.is_none()) {
      return Buffer.concat([start, end])

    } else if (sig.is_one()) {
      let data = sig.data.toString('hex')
      for (const c of [esc, start, end]) {
        data = data.replaceAll(c.toString('hex'), esc.toString('hex') + c.toString('hex'))
      }

      return Buffer.concat([start, Buffer.from(data, 'hex'), end])

    } else {
      return Buffer.concat([start,
        ...sig.sigs.map(s => this.pack(s)),
        end])
    }
  }

  unpack(packet, on_sig) {
    this.parser.parse(packet)

    while (this.parser.parsed.length) {
      const sig = this.parser.parsed.shift()

      const id = sig.at(0).string('hex')
      if (id in this.received) return

      this.received[id] = true
      on_sig(sig.at(1))
    }
  }

}

class Parser {

  constructor() {
    this.parsed = []
    this.one = []
    this.stack = [this.parsed]
    this.state = 'out'
  }

  parse(buffer) {
    for (const c of buffer) {
      this['on_' + this.state](c)
    }
    return this
  }

  push(value) {
    this.stack[this.stack.length - 1]
      .push(value)
  }

  on_out(c) {
    if (c == start[0]) {
      this.state = 'many'

    } else if (c == end[0]) {
      this.push(Sig.from(this.stack.pop()))
    }
  }

  on_many(c) {
    if (c == start[0]) {
      this.stack.push([])

    } else if (c == end[0]) {
      this.push(Sig.from(null))
      this.state = 'out'

    } else {
      this.state = 'one'
      this.on_one(c)
    }
  }

  on_one(c) {
    if (c == end[0]) {
      this.push(Sig.from(Buffer.from(this.one)))
      this.one = []
      this.state = 'out'

    } else if (c == esc[0]) {
      this.state = 'esc'

    } else {
      this.one.push(c)
    }
  }

  on_esc(c) {
    this.one.push(c)
    this.state = 'one'
  }
}
