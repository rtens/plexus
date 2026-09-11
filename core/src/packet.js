export default class Packet {
  identifier
  content
  index = 0
  final = true

  constructor(identifier, content) {
    this.identifier = identifier
    this.content = content
  }

  sequenced(index = 0) {
    this.index = index
    this.final = false
    return this
  }

  finalized(index) {
    this.index = index
    this.final = true
    return this
  }
}