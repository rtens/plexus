import { Point, Transform } from './math.js'
import { Color, mixed, black } from './colors.js'

export default class Camera {

  constructor(scene, transform = new Transform(), focal = 1) {
    this.scene = scene
    this.transform = transform
    this.focal = focal
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

    if (this.worker) this.worker.stop()
    this.worker = new Worker()

    for (let y = 0; y < ry; y++) {
      for (let x = 0; x < rx; x++) {
        this.worker.add(() => {
          const colors = this.rays(x, y, rx, ry, antialias)
            .map(({ origin, ray }) =>
              new Probe(this.scene, precision)
                .shoot(origin, ray))
          canvas.paint(x, y, mixed(colors))
        })
      }
    }

    return this.worker.run()
  }

  rays(x, y, rx, ry, antialias) {
    const origin = this.transform.on(new Point(0, 0, 0))
    const subs = antialias
      ? [[.87, .5], [-.87, .5], [0, -1]]
      : [[0, 0]]

    return subs
      .map(([dx, dy]) =>
        new Point(
          + ((x + .5 + dx / 4) / rx - .5),
          - ((y + .5 + dy / 4) / ry - .5) * (ry / rx),
          -this.focal
        ))
      .map(pixel =>
        this.transform.on(pixel).minus(origin).normalized())
      .map(ray => ({ origin, ray }))
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

class Probe {

  constructor(scene, precision) {
    this.scene = scene
    this.precision = precision
    this.max_travel = 100
    this.travel = 0
  }

  shoot(origin, ray) {
    const hits = this.scene.hits(
      origin, ray, this.precision,
      this.max_travel, this.travel)

    const closest = hits[0]
    if (closest) {
      // return new Color(1, 1, 1).times(1-closest.travel/10)
      // return new Color(1,1,1).times(1-(hit.travel-5))
      const point = origin.plus(ray.times(closest.travel))
      // return Color.from(point)
      const normal = closest.shape.normal(point, this.precision)
      return Color.from(normal)
    } else {
      return Color.from(ray.plus(new Point(.5, .5, .5)))
    }
  }
}
