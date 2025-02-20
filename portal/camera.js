import { norm, add, mul, mmul, neg, dot, rot3, mdot, mix, mix2 } from './math.js'

export default class Camera {
  constructor(scene, pos, rot, focal) {
    this.scene = scene

    this.pos = pos || [0, 0, 0]
    this.rot = rot || rot3([1, 0, 0], 0)
    this.focal = focal || 1
  }

  move(by) {
    this.pos = add(this.pos, mdot(this.rot, by))
  }

  rotate(u, r) {
    this.rot = mmul(this.rot, rot3(u, r))
  }

  async render(canvas, antialias = true) {
    const [rx, ry] = canvas.resolution
    const pixel = 1.4 / (rx * this.focal)
    const pipeline = []

    for (let y = 0; y < ry; y++) {
      for (let x = 0; x < rx; x++) {
        pipeline.push(() => {
          const rays = antialias
            ? this.rays(x, y, rx, ry)
            : [this.ray(x, y, rx, ry)]
          const colors = rays.map(ray =>
            new Marcher(this.scene, pixel)
              .march(this.pos, ray))
          canvas.paint(x, y, mix(colors))
        })
      }
    }

    while (pipeline.length) {
      await new Promise(resolve => setTimeout(() => {
        for (let i = 0; pipeline.length && i < 500; i++) {
          pipeline.shift()()
        }
        resolve()
      }))
    }
  }

  rays(x, y, rx, ry) {
    const subs = [[.87, .5], [-.87, .5], [0, -1]]
    return subs.map(([dx, dy]) => mdot(this.rot, norm([
      + ((x + .5 + dx / 4) / rx - .5),
      - ((y + .5 + dy / 4) / ry - .5) * (ry / rx),
      -this.focal
    ])))
  }

  ray(x, y, rx, ry) {
    return mdot(this.rot, norm([
      + ((x + .5 / 4) / rx - .5),
      - ((y + .5 / 4) / ry - .5) * (ry / rx),
      -this.focal
    ]))
  }
}

class Marcher {

  constructor(scene, pixel) {
    this.scene = scene
    this.pixel = pixel

    this.maxreflections = 5
    this.maxtravel = 100
    this.dimming = .7
    this.bg = [0, 0, 0, 0, 0]

    this.travel = 0
    this.reflections = 0
  }

  mindist() {
    return this.pixel * this.travel / 10
  }

  march(point, ray) {
    while (this.travel < this.maxtravel) {
      const [d, m] = this.scene(point)

      if (d <= 0) return m

      if (d < this.mindist()) {
        return this.fragment(m, point, ray)
      }

      this.travel += d
      point = add(point, mul(ray, d))
    }

    return this.bg
  }

  fragment(m, point, ray) {
    const n = this.normal(point)

    if (m[4] && this.reflections < this.maxreflections) {
      const refl = this.reflect(n, point, ray)
      m = mix2(refl, m, m[4])
    }

    return this.shade(m, n, ray)
  }

  shade(m, n, ray) {
    const f = (dot(ray, neg(n)) - 1) * this.dimming + 1
    return mix2(m, this.bg, f)
  }

  normal(point) {
    const e = this.pixel / 100
    const de = ve => this.scene(add(point, ve))[0]
    return norm([
      de([e, 0, 0]) - de([-e, 0, 0]),
      de([0, e, 0]) - de([0, -e, 0]),
      de([0, 0, e]) - de([0, 0, -e])
    ])
  }

  reflect(n, point, ray) {
    this.reflections++
    point = add(point, mul(n, this.mindist() * 1.1))
    ray = add(ray, neg(mul(n, 2 * dot(ray, n))))
    return this.march(point, ray)
  }
}
