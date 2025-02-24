export class Point {

  constructor(...values) {
    this.values = values
  }

  plus(point) {
    return this.map((v, i) => v + point.values[i])
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

  constructor(translation, rotation, scale) {
    this.translation = translation || new Point(0,0,0)
    this.rotation = rotation || new Rotation(new Point(1,0,0), 0)
    this.scale = scale || 1
  }

  on(point) {
    return point.plus(this.translation)
  }

  moved(point) {
    return new Transform(
      this.translation.plus(point),
      this.rotation,
      this.scale)
  }

  rotated(axis, radians) {
    return new Transform(
      this.translation,
      new Rotation(axis, radians).times(this.rotation),
      this.scale)
  }

  sclaed(factor) {
    return new Transform(
      this.translation,
      this.rotation,
      this.scale * factor)
  }

  inverse() {
    return new Transform(
      this.translation.times(-1),
      this.rotation,
      1/this.scale)
  }
}

export const moved = (...values) =>
  new Transform().moved(new Point(...values))

export const rotated = (axis_values, radians) =>
  new Transform().rotated(new Point(...axis_values), radians)

class Matrix {

  constructor(values) {
    this.values = values
  }

  on(point) {
    return new Point(this.rows().map(row => row.dot(point)))
  }

  times(matrix) {
    return new Matrix(
      this.rows().map(row =>
        matrix.columns().map(col => row.dot(col)))
    )
  }

  rows() {
    return this.values.map(row => new Point(row))
  }

  columns() {
    return this.values[0].map((_, c) =>
      new Point(this.values.map(row => row[c])))
  }
}

class Rotation extends Matrix {

  constructor(axis, radians) {
    super(rotation_matrix(axis.normalized().values, radians))
  }
}

function rotation_matrix([x, y, z], r) {
  const c = Math.cos(r)
  const s = Math.sin(r)
  const ci = 1 - c

  return [
    [x * x * ci + c, x * y * ci - z * s, x * z * ci + y * s],
    [x * y * ci + z * s, y * y * ci + c, y * z * ci - x * s],
    [x * z * ci - y * s, y * z * ci + x * s, z * z * ci + c]
  ]
}

export const sum = v => v.reduce((a, c) => a + c, 0)

export const clamp = (v, l, h) => Math.min(Math.max(v, l), h)

export const fade = (l, h, t) => l + (h - l) * t
