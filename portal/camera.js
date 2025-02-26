import { Point, Transform } from './math.js'
import { Color, mixed, black, white } from './colors.js'

export default class Camera {

  constructor(space, transform = new Transform(), focal = 1) {
    this.space = space
    this.transform = transform
    this.focal = focal
    this.mode = 'shaded'
    this.max_travel = 100
  }

  move(x, y, z) {
    const rel = this.transform.on(new Point(x, y, z))
      .minus(this.transform.on(new Point(0, 0, 0)))
    this.transform = this.transform.moved(rel)
  }

  rotate(x, y, z) {
    const u = new Point(x, y, z)
    const r = u.length()
    if (!r) return

    this.transform = this.transform.rotated(u, r)
  }

  zoom(factor) {
    this.focal += factor
  }

  scale(factor) {
    this.transform = this.transform.scaled(factor)
  }

  async render(canvas, antialias = true) {
    const [rx, ry] = canvas.resolution.values
    const precision = 1 / Math.max(rx, ry)
    const origin = this.transform.on(new Point(0, 0, 0))

    if (this.worker) this.worker.stop()
    this.worker = new Worker()

    for (let y = 0; y < ry; y++) {
      for (let x = 0; x < rx; x++) {
        this.worker.add(() => {
          const colors = this.rays(x, y, rx, ry, antialias)
            .map(ray => this.fragment(origin, ray, precision))
          canvas.paint(x, y, mixed(colors))
        })
      }
    }

    return this.worker.run()
  }

  rays(x, y, rx, ry, antialias) {
    const subs = antialias
      ? [[.87, .5], [-.87, .5], [0, -1]]
      : [[0, 0]]

    return subs
      .map(([dx, dy]) =>
        this.transform.rotation.on(new Point(
          + ((x + .5 + dx / 4) / rx - .5),
          - ((y + .5 + dy / 4) / ry - .5) * (ry / rx),
          -this.focal
        ).normalized()))
  }

  fragment(origin, ray, precision) {
    const hits = this.space.hits(origin, ray, precision, this.max_travel)

    if (!hits.length)
      return Color.from(ray.plus(new Point(.5, .5, .5)))

    const { shape, travel } = hits.reduce((a, c) =>
      (!a || c.travel < a.travel) ? c : a, null)

    if (this.mode == 'distance')
      return white.times(1 - travel / 10)

    const point = origin.plus(ray.times(travel))
    const normal = shape.normal(point, precision)

    if (this.mode == 'normal')
      return Color.from(normal)

    const color = shape.color(point)
    if (this.mode == 'flat')
      return color

    const dimming = .8
    const shade = normal.times(-1).dot(ray) * dimming + (1 - dimming)
    return color.mixed(black, shade)
  }
}

class Worker {

  constructor() {
    this.work = []
    this.running = true
  }

  add(work) {
    this.work.push(work)
  }

  stop() {
    this.running = false
  }

  async run() {
    while (this.work.length && this.running) {
      await new Promise(done => setTimeout(() => {
        for (let i = 0; i < 1000; i++) {
          if (!this.work.length) break
          this.work.shift()()
        }
        done()
      }))
    }

    return this.running
  }
}
