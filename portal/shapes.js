import { Point } from './math.js'

export class Shape {

  hit(origin, direction, precision, max_travel, travel = 0) { }

  normal(point, precision) { }

  material(point, precision) { }

  painted(material) {
    this.material = () => material
    return this
  }
}

class SdfShape extends Shape {

  hit(origin, direction, precision, max_travel, travel = 0) {
    while (travel < max_travel) {
      const point = origin.plus(direction.times(travel))
      const distance = this.distance(point)
      if (distance < precision * travel / 10) {
        return { travel, shape: this }
      }
      travel += distance
    }
    return null
  }

  normal(point, precision) {
    const e = precision / 10
    const d = (...v) => this.distance(point.plus(new Point(...v)))
    return new Point(
      d(e, 0, 0) - d(-e, 0, 0),
      d(0, e, 0) - d(0, -e, 0),
      d(0, 0, e) - d(0, 0, -e)
    ).normalized()
  }
}

export class SdfSphere extends SdfShape {

  constructor(radius = 1) {
    super()
    this.radius = radius
  }

  distance(point) {
    return point.length() - this.radius
  }
}
