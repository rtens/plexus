import net from 'net'

export default class Link {

  send(packet) {}

  receive(packet) {}
}

Link.Socket = class extends Link {

  constructor(socket) {
    super()
    this.socket = socket
    socket.on('data', data =>
      this.receive(data))
    socket.on('close', () => {
      this.closed = true
      console.log('closed')
    })
    socket.on('error', e => {
      this.closed = true
      console.log('error', e)
    })
  }

  send(packet) {
    if (this.closed) return
    this.socket.write(packet)
  }
}

Link.Client = class extends Link.Socket {

  constructor(host, port) {
    super(new net.Socket())
    this.socket.connect(port, host)
  }
}
