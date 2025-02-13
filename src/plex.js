import Proc from './proc.js'

export default class Plex extends Proc {

  constructor() {
    super()
    this.procs = []
  }

  add(proc) {
    this.procs.push(proc)
    proc.emit = sig => {
      this.bind(sig)
      this.emit(sig)
    }
    return proc
  }

  bind(sig) {
    this.procs.forEach(proc =>
      Promise.resolve()
        .then(() => proc.bind(sig))
        .catch(console.log))
  }
}
