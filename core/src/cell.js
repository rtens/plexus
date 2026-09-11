import Signal from './signal.js'

export default class Cell {

  emit() { return new Signal() }

  async detect(signal) { }
}