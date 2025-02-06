export default class Node {

  constructor(plex) {
    this.plex = plex
    plex.emit = value =>
      this.send(value)

    this.links = []
  }

  attach(link) {
    this.links.push(link)
  }

  detach(link) { }

  send(value) {
    const packet = this.pack(value)

    this.links.forEach(link =>
      link.send(packet))
  }
}
