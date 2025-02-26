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

  constructor(translation, rotation, scaling) {
    this.translation = translation
      || new Point(0, 0, 0)
    this.rotation = rotation
      || this.rotation_matrix(new Point(1, 0, 0), 0)
    this.scaling = scaling
      || 1
  }

  moved(translation) {
    return new Transform(
      this.translation.plus(translation),
      this.rotation,
      this.scaling)
  }

  rotated(axis, radians) {
    return new Transform(
      this.translation,
      this.rotation.times(this.rotation_matrix(axis, radians)),
      this.scaling)
  }

  scaled(factor) {
    return new Transform(
      this.translation,
      this.rotation,
      this.scaling * factor)
  }

  on(point) {
    point = point.times(this.scaling)
    point = this.rotation.on(point)
    point = this.translation.plus(point)
    return point
  }

  inverse() {
    return new Inverse(
      this.translation,
      this.rotation,
      this.scaling)
  }

  rotation_matrix(axis, radians) {
    const [x, y, z] = axis.normalized().values
    const c = Math.cos(radians)
    const s = Math.sin(radians)
    const ci = 1 - c

    return new Matrix([
      [x * x * ci + c, x * y * ci - z * s, x * z * ci + y * s],
      [x * y * ci + z * s, y * y * ci + c, y * z * ci - x * s],
      [x * z * ci - y * s, y * z * ci + x * s, z * z * ci + c]
    ])
  }
}

class Inverse {

  constructor(translation, rotation, scaling) {
    this.translation = translation.times(-1)
    this.rotation = rotation.transposed()
    this.scaling = 1 / scaling
  }

  on(point) {
    point = this.translation.plus(point)
    point = this.rotation.on(point)
    point = point.times(this.scaling)
    return point
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

  transposed() {
    return new Matrix(this.values[0].map((_, c) =>
      this.values.map((_, r) => this.values[r][c])))
  }
}

export const sum = v => v.reduce((a, c) => a + c, 0)

export const clamp = (v, l, h) => Math.min(Math.max(v, l), h)

export const fade = (l, h, t) => l + (h - l) * t
