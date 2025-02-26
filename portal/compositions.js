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

  hits(origin, direction, precision, max_travel, travel = 0) {
    return this.shapes
      .map(shape => shape.hit(origin, direction, precision, max_travel, travel))
      .filter(hit => hit)
  }
}

class Transformed extends Shape {

  constructor(shape, transform) {
    super()
    this.shape = shape
    this.inverse = transform.inverse()
  }

  hit(origin, direction, precision, max_travel, travel = 0) {
    const hit = this.shape.hit(
      this.inverse.on(origin),
      this.inverse.rotation.on(direction),
      precision,
      max_travel,
      travel)

    if (!hit) return null

    return {
      shape: this,
      travel: hit.travel / this.inverse.scaling
    }
  }

  normal(point, precision) {
    return this.shape.normal(this.inverse.on(point), precision)
  }

  material(point, precision) {
    return this.shape.material(this.inverse.on(point), precision)
  }

}
