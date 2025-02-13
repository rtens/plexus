import net from 'net'
import Plex from './src/plex.js'
import Node from './src/node.js'
import Link from './src/link.js'

const port = process.env.PORT || 4242

const server = net.createServer()

const plex = new Plex()
const node = new Node(plex)

server.on('connection', socket => {
  node.attach(new Link.Socket(socket))
  console.log('attached', socket)
})

server.on('error',e =>
  console.log('error', e))

server.on('close', () =>
  console.log('closed'))

server.listen(port, () =>
  console.log(`listening on ${port}`))
