import test from 'ava'
import Plek from '../src/plek.js'
import Plex from '../src/plex.js'
import Node from '../src/node.js'
import Link from '../src/link.js'

test.skip('pack and send emitted tings', t => {
  const plex = new Plex()
  const node = new Node(plex)
  node.generate_id = () => Buffer.from('45', 'hex')
  const plek = new Plek()
  plex.add(plek)
  const sent = []
  node.attach(new class extends Link {
    send(data) { sent.push(Ting.parse(data).print()) }
  })

  plek.emit(Ting.from('iu'))
  t.like(sent, ['[[ei][iu]]'])
})

test.todo('unpack and see received tings')

test.todo('ignore old tings')

test.todo('distribute received tings')

test.todo('do not loop back')
