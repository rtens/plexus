import { Transform } from './math.js'
import { Thing } from './shapes.js'

export class Group extends Thing {

  constructor() {
    super()
    this.things = []
  }

  add(thing, transform = new Transform()) {
    this.things.push({thing, transform})
    return this
  }

  hit(origin, direction, precision, max_travel, travel = 0) {
    let closest_hit = null
    for (const {thing, transform} of this.things) {
      const inverse = transform.inverse()
      const hit = thing.hit(
        inverse.on(origin),
        direction,
        precision,
        max_travel,
        travel)

      if (!hit) continue
      if (!closest_hit || hit.travel < closest_hit.travel) {
        closest_hit = hit
      }
    }
    return closest_hit
  }
}
