import test from 'ava'
import Proc from '../src/proc.js'
import Plex from '../src/plex.js'
import Node from '../src/node.js'
import Link from '../src/link.js'
import Sig from '../src/sig.js'

test('send none', t => {
  const plex = new Plex()
  const node = new Node(plex)
  node.generate_id = () => Buffer.from([1])
  const proc = plex.add(new Proc())
  const link = node.attach(new class extends Link {
    send(data) { this.sent = data.toString('hex') }
  })

  proc.emit(Sig.from(null))

  t.is(link.sent, '11110113111313')
})

test('send one', t => {
  const plex = new Plex()
  const node = new Node(plex)
  const proc = plex.add(new Proc())
  const link = node.attach(new class extends Link {
    send(data) { this.sent = data.toString('hex') }
  })

  proc.emit(Sig.from('foo'))

  t.is(link.sent.slice(-12), '11666f6f1313')
})

test('send many', t => {
  const plex = new Plex()
  const node = new Node(plex)
  const proc = plex.add(new Proc())
  const link = node.attach(new class extends Link {
    send(data) { this.sent = data.toString('hex') }
  })

  proc.emit(Sig.from(['foo', ['bar']]))

  t.is(link.sent.slice(-30), '1111666f6f13111162617213131313')
})

test('generate unique IDs', t => {
  const plex = new Plex()
  const node = new Node(plex)
  const proc = plex.add(new Proc())
  const link = node.attach(new class extends Link {
    sent = []
    send(data) { this.sent.push(data.toString('hex')) }
  })

  proc.emit(Sig.from())
  proc.emit(Sig.from())

  t.is(link.sent.length, 2)
  t.true(link.sent[0] != link.sent[1])
})

test('receive nothing', async t => {
  const plex = new Plex()
  const node = new Node(plex)
  const proc = plex.add(new class extends Proc {
    bind(sig) { this.bound = sig }
  })
  const waiter = plex.add(new Waiter)
  const link = node.attach(new Link)

  link.receive(Buffer.from('11118813111313', 'hex'))
  await waiter.done

  t.deepEqual(proc.bound, Sig.from(null))
})

test('receive something', async t => {
  const plex = new Plex()
  const node = new Node(plex)
  const proc = plex.add(new class extends Proc {
    bind(sig) { this.bound = sig }
  })
  const waiter = plex.add(new Waiter)
  const link = node.attach(new Link)

  link.receive(Buffer.from('1111881311666f6f1313', 'hex'))
  await waiter.done

  t.deepEqual(proc.bound, Sig.from('foo'))
})

test('escape packets', t => {
  const plex = new Plex()
  const node = new Node(plex)
  const proc = plex.add(new Proc())
  const link = node.attach(new class extends Link {
    send(data) { this.sent = data.toString('hex') }
  })

  proc.emit(Sig.from('88118812881388', 'hex'))

  t.is(link.sent.slice(-26), '11881211881212881213881313')
})

test('unescape packets', async t => {
  const plex = new Plex()
  const node = new Node(plex)
  const proc = plex.add(new class extends Proc {
    bind(sig) { this.bound = sig }
  })
  const waiter = plex.add(new Waiter)
  const link = node.attach(new Link)

  link.receive(Buffer.from('11110013111211881212881213881313', 'hex'))
  await waiter.done

  t.deepEqual(proc.bound, Sig.from('118812881388', 'hex'))
})

test('forward packets', t => {
  const plex = new Plex()
  const node = new Node(plex)
  const receiver = node.attach(new Link)
  const sender = node.attach(new class extends Link {
    send(packet) { this.sent = packet }
  })

  receiver.receive(Buffer.from('1111441311881313', 'hex'))

  t.deepEqual(sender.sent, Buffer.from('1111441311881313', 'hex'))
})

test('ignore old packets', async t => {
  const plex = new Plex()
  const node = new Node(plex)
  const proc = plex.add(new class extends Proc {
    bounds = []
    bind(sig) { this.bounds.push(sig) }
  })
  const waiter = plex.add(new Waiter)
  const link = node.attach(new Link)
  const other = node.attach(new class extends Link {
    sent = []
    send(packet) { this.sent.push(packet) }
  })

  link.receive(Buffer.from('1111441311011313', 'hex'))
  link.receive(Buffer.from('1111441311021313', 'hex'))
  await waiter.done

  t.deepEqual(proc.bounds, [Sig.from('01', 'hex')])
  t.deepEqual(other.sent, [Buffer.from('1111441311011313', 'hex')])
})

test('do not loop back', t => {
  const plex = new Plex()
  const node = new Node(plex)
  const link = node.attach(new class extends Link {
    sent = []
    send(packet) { this.sent.push(packet) }
  })

  link.receive(Buffer.from('1111441311881313', 'hex'))

  t.deepEqual(link.sent, [])
})

class Waiter {

  constructor() {
    this.done = new Promise(resolve =>
      this.resolve = resolve)
  }

  bind() {
    this.resolve()
  }
}
