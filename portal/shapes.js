import { Point } from './math.js'

export class Shape {

  hit(origin, direction, precision, max_travel) { }

  normal(point, precision) { }

  color(point, precision) { }

  painted(color) {
    this.color = () => color
    return this
  }
}

class SdfShape extends Shape {

  hit(origin, direction, precision, max_travel) {
    let travel = 0
    while (travel < max_travel) {
      const point = origin.plus(direction.times(travel))
      const distance = this.distance(point)
      if (distance <= precision * travel / 10) {
        return travel
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

  constructor(primary = 1, secondary = 1 / 2) {
    super()
    this.primary = primary
    this.secondary = secondary
  }

  distance(point) {
    const q = new Point(new Point(point.x, point.z).length() - this.primary, point.y)
    return q.length() - this.secondary
  }
}

export class AnalyticalSphere extends Shape {

  constructor(radius = 1) {
    super()
    this.radius = radius
  }

  hit(origin, direction) {
    // https://en.wikipedia.org/wiki/Line%E2%80%93sphere_intersection
    const o = origin
    const u = direction
    const r = this.radius
    const sqr = x => Math.pow(x, 2)
    const sqrt = x => Math.sqrt(x)

    const D = sqr(u.dot(o)) - (sqr(o.length()) - sqr(r))
    if (D < 0) return

    const d = -u.dot(o) - sqrt(D)
    return d
  }

  normal(point) {
    return point.normalized()
  }
}

export class AnalyticalBox extends Shape {

  constructor(dimensions) {
    super()
    this.dimensions = dimensions || new Point(1, 1, 1)
  }

  hit(origin, direction) {
    const ds = ['x', 'y', 'z']
    const not = nd => ds.filter(d => d != nd)

    const travels = []
    for (const s of [1, -1]) {
      for (const d of ds) {
        const travel = (s * this.dimensions[d] - origin[d]) / direction[d]
        const point = origin.plus(direction.times(travel))

        const inside = not(d).every(nd => Math.abs(point[nd]) < this.dimensions[nd])
        if (inside) travels.push(travel)
      }
    }

    if (travels.length) return Math.min(...travels)
  }

  normal(point) {
    const max = Math.max(...point.values.map(Math.abs))
    return point.map(v => Math.abs(v) == max ? 1 : 0)
  }
}
