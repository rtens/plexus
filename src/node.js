import crypto from 'crypto'
import Parser from './parser.js'

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
    const sig = this.unpack(packet)
    if (!sig) return

    this.plex.bind(sig)
    this.links
      .filter(l => l != receiver)
      .forEach(l => l.send(packet))
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

  unpack(packet) {
    const sig = new Parser().parse(packet).parsed[0]
    const id = sig.at(0).toString('hex')
    if (id in this.received) {
      return null
    }

    this.received[id] = true
    return sig.at(1)
  }

}
