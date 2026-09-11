import test from 'ava'
import Node from '../../src/node.js'
import Link from '../../src/link.js'
import Packet from '../../src/packet.js'
import Cell from '../../src/cell.js'

test('no cells', async t => {
  const node = new Node()
  const link = node.attach(new Link())

  await link.receive(new Packet('one', 'foo'))

  t.pass()
})

test('multiple cells', async t => {
  const node = new Node()
  const link = node.attach(new Link())
  const one = node.add(new TestCell())
  const two = node.add(new TestCell())

  await link.receive(new Packet('one', 'foo'))

  t.deepEqual(await one.detected, ['foo'])
  t.deepEqual(await two.detected, ['foo'])
})

test('already received packet', async t => {
  const node = new Node()
  const link = node.attach(new Link())
  const cell = node.add(new TestCell())

  await link.receive(new Packet('one', 'foo'))
  await link.receive(new Packet('one', 'bar'))

  t.deepEqual(cell.detected, ['foo'])
})

test('several packets', async t => {
  const node = new Node()
  const link = node.attach(new Link())
  const cell = node.add(new TestCell())

  await link.receive(new Packet('one', 'foo'))
  await link.receive(new Packet('two', 'bar'))

  t.deepEqual(cell.detected, ['foo', 'bar'])
})

test('sequence of packets', async t => {
  const node = new Node()
  const link = node.attach(new Link())
  const cell = node.add(new TestCell())

  const done = link.receive(new Packet('one', 'foo').sequenced())
  link.receive(new Packet('one', 'bar').finalized(1))
  await done

  t.deepEqual(cell.detected, ['foobar'])
})

test('interrupted sequence', async t => {
  const node = new Node()
  const link = node.attach(new Link())
  const cell = node.add(new TestCell())

  const done = link.receive(new Packet('one', 'foo').sequenced())
  link.receive(new Packet('two', 'bar'))
  link.receive(new Packet('one', 'baz').finalized(1))
  await done

  t.deepEqual(cell.detected, ['bar', 'foobaz'])
})

test('out of sequence packets', async t => {
  const node = new Node()
  const link = node.attach(new Link())
  const cell = node.add(new TestCell())

  const done = link.receive(new Packet('one', 'foo').sequenced(1))
  link.receive(new Packet('one', 'bar').finalized(2))
  link.receive(new Packet('one', 'baz').sequenced(0))
  await done

  t.deepEqual(cell.detected, ['bazfoobar'])
})

test('mutliple final packets', async t => {
  const node = new Node()
  const link = node.attach(new Link())
  const cell = node.add(new TestCell())

  await link.receive(new Packet('one', 'foo').finalized(0))
  await link.receive(new Packet('one', 'bar').finalized(1))
  await link.receive(new Packet('one', 'baz').finalized(2))

  t.deepEqual(cell.detected, ['foo'])
})

test('error during detection', async t => {
  const node = new Node()
  const link = node.attach(new Link())
  node.add(new class extends Cell {
    async detect() { throw 'oops' }
  })

  const caught = []
  node.on_error = e => caught.push(e)

  await link.receive(new Packet('one', 'foo'))

  t.deepEqual(caught, ['oops'])
})

class TestCell extends Cell {
  detected = []

  async detect(signal) {
    let data = ''
    while (!signal.ended()) {
      data += await signal.receive()
    }
    this.detected.push(data)
  }
}