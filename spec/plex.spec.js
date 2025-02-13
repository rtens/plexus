import test from 'ava'
import Plex from '../src/plex.js'
import Proc from '../src/proc.js'

test('distribute bound sigs', async t => {
  const plex = new Plex()
  const Binder = class extends Proc {
    bind(sig) { this.bound = sig }
  }
  const a = plex.add(new Binder)
  const b = plex.add(new Binder)
  const waiter = plex.add(new Waiter)
  plex.add(new Proc)

  plex.bind('foo')

  await waiter.done
  t.is(a.bound, 'foo')
  t.is(b.bound, 'foo')
})

test('distribute emitted sigs', async t => {
  const plex = new Plex()
  const Binder = class extends Proc {
    bind(sig) { this.bound = sig }
  }
  const a = plex.add(new Binder)
  const b = plex.add(new Binder)
  const emitter = plex.add(new Binder)
  const waiter = plex.add(new Waiter)

  emitter.emit('foo')

  await waiter.done
  t.is(a.bound, 'foo')
  t.is(b.bound, 'foo')
  t.is(emitter.bound, 'foo')
})

test('emit emitted sigs', t => {
  const plex = new Plex()
  let emitted = ''
  plex.emit = sig => emitted += sig
  const proc = plex.add(new Proc)

  proc.emit('foo')

  t.is(emitted, 'foo')
})

test('do not emit bound sigs', async t => {
  const plex = new Plex()
  const emitted = ''
  plex.emit = sig => emitted += sig
  const waiter = plex.add(new Waiter)

  plex.bind('foo')

  await waiter.done
  t.is(emitted, '')
})

test('log errors', async t => {
  const plex = new Plex()
  plex.add({ bind() { throw 'boom' } })

  const logged = []
  const log = console.log
  console.log = (...args) => logged.push(args)

  plex.bind('foo')

  await wait_for(() => logged.length)
  console.log = log

  t.deepEqual(logged, [['boom']])
})

test('log rejections', async t => {
  const plex = new Plex()
  plex.add({ bind() { return Promise.reject('boom') } })

  const logged = []
  const log = console.log
  console.log = (...args) => logged.push(args)

  plex.bind('foo')

  await wait_for(() => logged.length)
  console.log = log

  t.deepEqual(logged, [['boom']])
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

function wait_for(condition) {
  return new Promise(resolve => {
    const wait = () =>
      condition()
        ? resolve()
        : setTimeout(wait)
    wait()
  })
}
