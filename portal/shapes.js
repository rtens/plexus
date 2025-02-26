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
      if (distance <= precision * travel / 10) {
        return { travel, shape: this }
      }
      travel += distance
    }
    return null
  }

  normal(point, precision) {
    const e = precision
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

export class SdfBox extends SdfShape {

  constructor(dimensions) {
    super()
    this.dimensions = dimensions || new Point(1, 1, 1)
  }

  distance(point) {
    const q = point.map(Math.abs).plus(this.dimensions.times(-1))
    return q.map(n => Math.max(n, 0)).length() + Math.min(Math.max(...q.values, 0), 0);
  }
}

export class SdfTorus extends SdfShape {

  constructor(primary = 1, secondary = 1/2) {
    super()
    this.primary = primary
    this.secondary = secondary
  }

  distance(point) {
    const q = new Point(new Point(point.x, point.z).length() - this.primary, point.y)
    return q.length() - this.secondary
  }
}
