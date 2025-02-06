import Plek from './plek.js'

export default class Plex extends Plek {

  constructor() {
    super()
    this.pleks = []
  }

  see(ting) {
    this.pleks.forEach(plek =>
      Promise.resolve()
        .then(() => plek.see(ting))
        .catch(console.log))
  }

  add(plek) {
    plek.emit = ting => {
      this.see(ting)
      this.emit(ting)
    }
    this.pleks.push(plek)
  }

  remove(plek) {}
}
