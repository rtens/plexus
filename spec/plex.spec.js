import test from 'ava'
import Plex from '../src/plex.js'
import Plek from '../src/plek.js'

test('distribute seen tings', async t => {
  const plex = new Plex()
  const seen = {a: [], b: []}
  plex.add(new class extends Plek {
    see(ting) { seen.a.push(ting) }
  })
  plex.add(new class extends Plek {
    see(ting) { seen.b.push(ting) }
  })
  plex.add(new Plek)

  const waiter = new Waiter
  plex.add(waiter)

  plex.see('foo')
  await waiter.done
  t.like(seen, {
    a: ['foo'],
    b: ['foo']
  })
})

test('distribute emitted tings', async t => {
  const plex = new Plex()
  const seen = {a: [], b: []}
  plex.add(new class extends Plek {
    see(ting) { seen.a.push(ting) }
  })
  plex.add(new class extends Plek {
    see(ting) { seen.b.push(ting) }
  })
  const plek = new Plek
  plek.emit('unseen')
  plex.add(plek)
  const waiter = new Waiter
  plex.add(waiter)

  plek.emit('foo')
  await waiter.done
  t.like(seen, {
    a: ['foo', undefined],
    b: ['foo', undefined]
  })
})

test('emit emitted tings', t => {
  const plex = new Plex()
  const emitted = []
  plex.emit = ting => emitted.push(ting)
  const plek = new Plek
  plex.add(plek)

  plek.emit('foo')
  t.like(emitted, ['foo', undefined])
})

test('do not emit seen tings', async t => {
  const plex = new Plex()
  const emitted = []
  plex.emit = ting => emitted.push(ting)
  const waiter = new Waiter
  plex.add(waiter)

  plex.see('foo')
  await waiter.done
  t.like(emitted, [undefined])
})

test('log errors', async t => {
  const logged = []
  const log = console.log
  console.log = (...args) => logged.push(args)
  const plex = new Plex()
  plex.add(new class extends Plek {
    see(ting) { throw 'boom' }
  })
  const waiter = new Waiter
  plex.add(waiter)

  plex.see('foo')
  await waiter.done
  t.like(logged, [
    ['boom'],
    undefined
  ])
  console.log = log
})

test('log rejections', async t => {
  const logged = []
  const log = console.log
  console.log = (...args) => logged.push(args)
  const plex = new Plex()
  plex.add(new class extends Plek {
    see(ting) { return Promise.reject('boom') }
  })

  plex.see('foo')
  await new Promise(y => {
    const wait = () =>
          logged.length ? y()
          : setTimeout(wait)
    wait()
  })
  t.like(logged, [
    ['boom'],
    undefined
  ])
  console.log = log
})

class Waiter extends Plek {

  constructor() {
    super()
    this.done = new Promise(y =>
      this.resolve = y)
  }

  see() {
    this.resolve()
  }
}
