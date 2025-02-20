import { mul } from './math.js'

export default class Canvas {
  static state = 'up'
  static last = null

  constructor(element, factor = 1) {
    this.ctx = element.getContext("2d")

    this.size = [element.width, element.height]
    this.resolution = mul(this.size, 1 / factor)
    this.pixel = [factor, factor]
  }

  paint(x, y, color) {
    const [pw, ph] = this.pixel
    const [r, g, b] = mul(color, 255).map(Math.round)

    this.ctx.fillStyle = `rgb(${r} ${g} ${b})`
    this.ctx.fillRect(x * pw, y * ph, pw, ph)
  }
}