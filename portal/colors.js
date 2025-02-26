import { Point, sum } from './math.js'

export class Color extends Point {

  constructor(red, green, blue) {
    super(red, green, blue)
    this.red = red
    this.green = green
    this.blue = blue
  }

  static from(point) {
    return new Color(...point.values)
  }

  mixed(color, amount = .5) {
    return mixed([this, color], [amount, 1 - amount])
  }

  map(f) {
    return Color.from(super.map(f))
  }
}

export const mixed = (colors, ratios = null) => {
  ratios ||= colors.map(() => 1)
  const sr = sum(ratios)
  return colors[0].map((_, i) =>
    Math.sqrt(sum(colors.map((c, j) =>
      c.values[i] * c.values[i] * ratios[j] / sr))))
}

export const black = new Color(0, 0, 0)

export const white = new Color(1, 1, 1)

export const cyan = new Color(0, 1, 1)

export const magenta = new Color(1, 0, 1)

export const yellow = new Color(1, 1, 0)

export const red = new Color(1, 0, 0)

export const green = new Color(0, 1, 0)

export const blue = new Color(0, 0, 1)
