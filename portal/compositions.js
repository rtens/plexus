import { Transform } from './math.js'

export class Space {

  constructor() {
    this.shapes = []
  }

  add(shape, transform = new Transform()) {
    this.shapes.push({ shape, transform })
    return this
  }

  hits(origin, direction, precision, max_travel, travel = 0) {
    const hits = []
    for (const { shape, transform } of this.shapes) {
      const inverse = transform.inverse()
      const hit = shape.hit(
        inverse.on(origin),
        inverse.rotation.on(direction),
        precision,
        max_travel,
        travel)

      if (hit) hits.push(hit)
    }
    return hits
  }
}
