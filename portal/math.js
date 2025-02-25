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
    this.rotation = rotation
    this.scaling = scaling
  }

  moved(translation) {
    if (this.translation)
      translation = this.translation.plus(translation)

    return new Transform(translation, this.rotation, this.scaling)
  }

  rotated(axis, radians) {
    let rotation = this.rotation_matrix(axis, radians)

    if (this.rotation)
      rotation = this.rotation.times(rotation)

    return new Transform(this.translation, rotation, this.scaling)
  }

  scaled(factor) {
    const scaling = (this.scaling || 1) * factor
    return new Transform(this.translation, this.rotation, scaling)
  }

  on(point) {
    if (this.rotation)
      point = this.rotation.on(point)
    if (this.translation)
      point = this.translation.plus(point)
    if (this.scaling)
      point = point.times(this.scaling)
    return point
  }

  inverse() {
    return this
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
