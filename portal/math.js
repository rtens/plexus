export class Point {

  constructor(x, y, z) {
    this.values = [x, y, z]
    this.x = x
    this.y = y
    this.z = z
  }

  plus(point) {
    return this.map((v, i) => v + point.values[i])
  }

  minus(point) {
    return this.plus(point.times(-1))
  }

  times(factor) {
    return this.map(v => v * factor)
  }

  dot(point) {
    return sum(this.values.map((v, i) => v * point.values[i]))
  }

  length() {
    return Math.sqrt(sum(this.values.map(v => v * v)))
  }

  normalized() {
    return this.times(1 / this.length())
  }

  map(f) {
    return new Point(...this.values.map(f))
  }
}

export class Transform {

  add(transform) {
    return new Combination(transform, this)
  }

  on(point) {
    if (this.next) return this.next.on(point)
    return point
  }

  inverse() {
    return this
  }
}

class Combination extends Transform {

  constructor(first, then) {
    super()
    this.first = first
    this.second = then
  }

  on(point) {
    return this.second.on(this.first.on(point))
  }
}

export class Translation extends Transform {

  constructor(point) {
    super()
    this.point = point
  }

  on(point) {
    return super.on(point.plus(this.point))
  }
}

export class Rotation extends Transform {

  constructor(axis, radians) {
    super()
    this.axis = axis
    this.radians = radians
    this.rotation = this.rotation_matrix()
  }

  on(point) {
    return super.on(this.rotation.on(point))
  }

  rotation_matrix() {
    const [x, y, z] = this.axis.normalized().values
    const c = Math.cos(this.radians)
    const s = Math.sin(this.radians)
    const ci = 1 - c

    return new Matrix([
      [x * x * ci + c, x * y * ci - z * s, x * z * ci + y * s],
      [x * y * ci + z * s, y * y * ci + c, y * z * ci - x * s],
      [x * z * ci - y * s, y * z * ci + x * s, z * z * ci + c]
    ])
  }
}

class Matrix {

  constructor(values) {
    this.values = values
  }

  on(point) {
    return new Point(...this.rows().map(row => row.dot(point)))
  }

  times(matrix) {
    return new Matrix(
      this.rows().map(row =>
        matrix.columns().map(col => row.dot(col)))
    )
  }

  rows() {
    return this.values.map(row => new Point(...row))
  }

  columns() {
    return this.values[0].map((_, c) =>
      new Point(...this.values.map(row => row[c])))
  }
}

export const sum = v => v.reduce((a, c) => a + c, 0)

export const clamp = (v, l, h) => Math.min(Math.max(v, l), h)

export const fade = (l, h, t) => l + (h - l) * t
