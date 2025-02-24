import { Point, Transform } from './math.js'
import { Color, mixed, black } from './colors.js'

export default class Camera {

  constructor(scene, transform = new Transform(), focal = 1) {
    this.scene = scene
    this.transform = transform
    this.focal = focal
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
            .map(ray => new Probe(this.scene, precision)
                 .shoot(origin, ray))
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
    return subs.map(([dx, dy])  =>
      this.transform.on(new Point(
        + ((x + .5 + dx / 4) / rx - .5),
        - ((y + .5 + dy / 4) / ry - .5) * (ry / rx),
        -this.focal
      )).normalized())
  }
}

class Worker {

  constructor() {
    this.work = []
    this.running = true
  }

  add(work) {
    this.work.push(work)  }

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
    const hit = this.scene.hit(
      origin, ray, this.precision,
      this.max_travel, this.travel)

    if (hit) {
      // return new Color(1,1,1).times(1-(hit.travel-5))
      const point = origin.plus(ray.times(hit.travel))
      // return Color.from(point)
      const normal = hit.shape.normal(point, this.precision)
      return Color.from(normal)
    } else {
      return new Color(0,0,0)
      return Color.from(ray.plus(new Point(.5,.5,.5)))
    }
  }
}
