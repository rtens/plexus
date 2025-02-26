import { Transform } from './math.js'
import { Shape } from './shapes.js'

export class Space {

  constructor() {
    this.shapes = []
  }

  add(shape, transform = new Transform()) {
    this.shapes.push(new Transformed(shape, transform))
    return this
  }

  hits(origin, direction, precision, max_travel) {
    const hit = shape => shape.hit(origin, direction, precision, max_travel)
    return this.shapes
      .map(shape => ({ shape, travel: hit(shape) }))
      .filter(({ travel }) => travel)
  }
}

class Transformed extends Shape {

  constructor(shape, transform) {
    super()
    this.shape = shape
    this.transform = transform
    this.inverse = transform.inverse()
  }

  hit(origin, direction, precision, max_travel) {
    const hit = this.shape.hit(
      this.inverse.on(origin),
      this.inverse.rotation.on(direction),
      precision,
      max_travel)

    if (hit) return hit / this.inverse.scaling
  }

  normal(point, precision) {
    return this.transform.rotation.on(this.shape.normal(this.inverse.on(point), precision))
  }

  color(point, precision) {
    return this.shape.color(this.inverse.on(point), precision)
  }

}
