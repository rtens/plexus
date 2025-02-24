import { Point } from './math.js'

export default class Canvas {

  constructor(element, pixel = 1) {
    this.ctx = element.getContext("2d")
    this.size = new Point(element.width, element.height)
    this.resolution = this.size.times(1 / pixel)
    this.pixel = pixel
  }

  paint(x, y, color) {
    const {red, green, blue} = color.times(255).map(Math.round)

    this.ctx.fillStyle = `rgb(${red} ${green} ${blue})`
    this.ctx.fillRect(x * this.pixel, y * this.pixel, this.pixel, this.pixel)
  }
}
