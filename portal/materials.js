import { Color } from './colors.js'

export class Material {

  constructor(color) {
    this.color = color
    this.reflectiveness = 0
    this.transparency = 0
    this.refractive_index = 0
  }

  reflective(reflectiveness) {
    this.reflectiveness = reflectiveness
    return this
  }

  transparent(transparency, refractive_index = 1) {
    this.transparency = transparency
    return this
  }
}

export const flat = (r, g, b) => new Material(new Color(r, g, b))
