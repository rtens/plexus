import test from 'ava'
import Node from '../../src/node.js'
import Link from '../../src/link.js'
import Packet from '../../src/packet.js'

test('one link', async t => {
  const node = new Node()
  const link = node.attach(new TestLink())

  await link.receive(new Packet('one', 'foo'))

  t.deepEqual(link.sent, [])
})

test('multiple links', async t => {
  const node = new Node()
  const one = node.attach(new TestLink())
  const two = node.attach(new TestLink())
  const three = node.attach(new TestLink())

  await one.receive(new Packet('one', 'foo'))

  t.deepEqual(one.sent, [])
  t.deepEqual(two.sent, [new Packet('one', 'foo')])
  t.deepEqual(three.sent, [new Packet('one', 'foo')])
})

test('already received packet', async t => {
  const node = new Node()

  const one = node.attach(new Link())
  await one.receive(new Packet('one', 'foo'))

  const two = node.attach(new TestLink())
  await one.receive(new Packet('one', 'foo'))

  t.deepEqual(two.sent, [])
})

test('several packets', async t => {
  const node = new Node()

  const one = node.attach(new Link())
  await one.receive(new Packet('one', 'foo'))

  const two = node.attach(new TestLink())
  await one.receive(new Packet('two', 'foo'))

  t.deepEqual(two.sent, [new Packet('two', 'foo')])
})

test('sequence of packets', async t => {
  const node = new Node()

  const one = node.attach(new Link())
  await one.receive(new Packet('one', 'foo').sequenced())

  const two = node.attach(new TestLink())
  await one.receive(new Packet('one', 'foo').finalized(1))

  t.deepEqual(two.sent, [new Packet('one', 'foo').finalized(1)])
})

test('sequence matches identifier', async t => {
  const node = new Node()

  const one = node.attach(new Link())
  await one.receive(new Packet('one', 'foo'))

  const two = node.attach(new TestLink())
  await one.receive(new Packet('on', 'foo'))

  t.deepEqual(two.sent, [new Packet('on', 'foo')])
})

test('error while sending', async t => {
  const node = new Node()

  const one = node.attach(new Link())
  node.attach(new class extends Link {
    async send() { throw 'oops' }
  })

  const caught = []
  node.on_error = e => caught.push(e)

  await one.receive(new Packet('one', 'foo'))

  t.deepEqual(caught, ['oops'])
})

class TestLink extends Link {
  sent = []

  async send(p) {
    this.sent.push(p)
  }
}