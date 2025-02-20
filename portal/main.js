////// Shapes ////////
const sphere = p => len(p) - 1

const box = b => p => {
  const q = add(p.map(Math.abs), neg(b))
  return len(q.map(n => Math.max(n, 0))) + Math.min(Math.max(...q, 0), 0);
}

const torus = ([tx, ty]) => ([x, y, z]) => {
  const q = [len([x, z]) - tx, y]
  return len(q) - ty
}

////// Materials ////////
const cyan = () => [0, 1, 1, 0, 0]
const magenta = () => [1, 0, 1, 0, 0]
const yellow = () => [1, 1, 0, 0, 0]
const red = () => [1, 0, 0, 0, 0]
const green = () => [0, 1, 0, 0, 0]
const blue = () => [0, 0, 1, 0, 0]
const transp = (t, m) => p => (([r, g, b, _, s]) => [r, g, b, t, s])(m(p))
const refl = (s, m) => p => (([r, g, b, t, _]) => [r, g, b, t, s])(m(p))

////// Construction ////////
const obj = (sdf, mat) => p => [sdf(p), mat(p)]

const union = (...objs) => p =>
      objs.reduce((a, c) => !a || c(p)[0] < a[0] ? c(p) : a, null)

const sunion = (k, o1, o2) => p => {
  const [d1, m1] = o1(p)
  const [d2, m2] = o2(p)
  const h = clamp(.5 + .5 * (d2 - d1) / k, 0, 1)
  return [
    fade(d2, d1, h) - k * h * (1 - h),
    mix2(m1, m2, h)
  ]
}

const move = v => f => p => f(add(p, neg(v)))

const rot = (u, r) => f => p => f(mdot(rot3(u, r), p))

const scale = s => f => p => (([d, m]) => [d * s, m])(f(mul(p, 1 / s)))

const round = r => f => p => (([d, m]) => [d - r, m])(f(p))

const $ = (i, ...p) => p.reduce((a, c) => c(a), i)

////// Rendering ////////
let scene = union(
  $(obj(box([.4, 1, .6]), refl(.2, magenta)),
    rot([1, 0, 0], -.6),
    move([-1.8, 0, -6])),
  $(obj(sphere, refl(.2, cyan)),
    move([0, .5, -7])),
  $(obj(torus([1.2, .3]), refl(.3, yellow)),
    rot([0, 0, 1], -1),
    move([1.5, -.5, -6])))

class Camera {
  constructor(pos, rot, focal) {
    this.pos = pos || [0, 0, 0]
    this.rot = rot || rot3([1, 0, 0], 0)
    this.focal = focal || 1
  }

  stop() {
    this.stopped = true
  }

  async render(scene, canvas) {
    const [rx, ry] = canvas.resolution
    const pixel = 1.4 / (rx * this.focal)

    const chunk = 500
    for (let i = 0; !this.stopped && i < rx * ry; i += chunk) {
      const c = i
      await new Promise(resolve => setTimeout(() => {
        for (let j = c; !this.stopped && j < c + chunk; j++) {
          const x = j % rx
          const y = Math.floor(j / rx)

          const materials = this.rays(x, y, rx, ry)
                .map(ray => new Marcher(this, scene, pixel)
                     .march(this.pos, ray))
          canvas.paint(x, y, mix(materials))
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
}

class Marcher {

  constructor(camera, scene, pixel) {
    this.camera = camera
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
    while (!this.camera.stopped && this.travel < this.maxtravel) {
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

class Canvas {
  static state = 'up'
  static last = null

  constructor(factor = 1) {
    const element = document.getElementById("myCanvas")
    this.ctx = element.getContext("2d")

    this.size = [element.width, element.height]
    this.resolution = mul(this.size, 1 / factor)

    const at = e => [e.clientX, e.clientY]

    element.onmousedown = e => {
      Canvas.state = 'down'
      Canvas.last = at(e)
    }

    element.onmouseup = e => {
      if (Canvas.state == 'down') {
        const now = Canvas.last
        clicked(now, now.map(v => Math.floor(v / factor) - 1))
      }
      Canvas.state = 'up'
    }

    element.onmousemove = e => {
      if (Canvas.state == 'up') return
      Canvas.state = 'drag'

      const now = at(e)
      dragged(Canvas.last, now)
      Canvas.last = now
    }

    const touch = handler => e => {
      e.preventDefault()
      handler(e.touches[0])
    }
    element.ontouchstart = touch(element.onmousedown)
    element.ontouchend = touch(element.onmouseup)
    element.ontouchmove = touch(element.onmousemove)
  }

  paint(x, y, color) {
    const [cw, ch] = [0, 1].map(i => this.size[i] / this.resolution[i])
    const [r, g, b] = mul(color, 255).map(Math.round)
    this.ctx.fillStyle = `rgb(${r} ${g} ${b})`
    this.ctx.fillRect(x * cw, y * ch, cw, ch)
  }
}

let camera = new Camera()

async function render(cam) {
  for (const prog of [20, 10, 5, 2, 1]) {
    const start = Date.now()
    await cam.render(scene, new Canvas(prog))
    console.log(prog, (Date.now() - start) / 1000)
  }
}

render(camera)

////// Control ///////
const cam = {
  pos: [0, 0, 0],
  rot: rot3([1, 0, 0], 0),
  foc: 1,
  move: v => cam.pos = add(cam.pos, mdot(cam.rot, v)),
  rotate: (u, r) => cam.rot = mmul(cam.rot, rot3(u, r)),
  state: 'rotate'
}

const step = .3
const turn = .05
const actions = [
  ['a', 'left', () => cam.move([-step, 0, 0])],
  ['d', 'right', () => cam.move([step, 0, 0])],
  ['w', 'up', () => cam.move([0, step, 0])],
  ['s', 'down', () => cam.move([0, -step, 0])],
  ['q', 'backward', () => cam.move([0, 0, step])],
  ['e', 'forward', () => cam.move([0, 0, -step])],
  ['j', 'turn left', () => cam.rotate([0, 1, 0], turn)],
  ['l', 'turn right', () => cam.rotate([0, 1, 0], -turn)],
  ['i', 'turn up', () => cam.rotate([1, 0, 0], turn)],
  ['k', 'turn down', () => cam.rotate([1, 0, 0], -turn)],
  ['u', 'turn counter', () => cam.rotate([0, 0, 1], turn)],
  ['o', 'turn clockwise', () => cam.rotate([0, 0, 1], -turn)],
  ['r', 'zoom in', () => cam.foc *= 1.1],
  ['f', 'zoom out', () => cam.foc /= 1.1],
  ['x', 'rotate', () => cam.state = 'rotate'],
  ['c', 'pan', () => cam.state = 'pan'],
  ['v', 'walk', () => cam.state = 'walk'],
]

const buttons = document.getElementById('buttons')
for (const [key, caption, action] of actions) {
  const button = document.createElement('button')
  button.innerText = `${caption} (${key})`
  button.style.width = '15em'
  button.style.height = '5em'
  button.style.backgroundColor = '#111'
  button.style.border = '1px solid grey'
  button.style.color = 'grey'
  button.onclick = () => perform(action)
  buttons.appendChild(button)
}

function perform(action) {
  camera.stop()
  action()
  camera = new Camera(cam.pos, cam.rot, cam.foc)
  render(camera)
}

document.onkeydown = ({ key }) => {
  const action = actions.find(([k]) => k == key)
  if (action) perform(action[2])
}

function clicked(c, p) {
  console.log('clicked', c, p)
}

function dragged(a, b) {
  const [x, y] = add(b, neg(a))

  if (cam.state == 'pan') {
    perform(() => cam.move(mul([x, -y, 0], 0.01)))
  } else if (cam.state == 'walk') {
    perform(() => cam.move(mul([0, 0, y], 0.01)))
    const u = [0, x, 0]
    const r = -len(u) / 500
    if (!r) return
    perform(() => cam.rotate(u, r))
  } else {
    const u = [y, x, 0]
    const r = -len(u) / 500
    if (!r) return

    perform(() => cam.rotate(u, r))
  }
}

/////// Math ////////

function norm(v) {
  const l = len(v)
  return v.map(n => n / l)
}

function len(v) {
  return Math.sqrt(sum(v.map(n => n * n)))
}

function add(...vs) {
  return vs[0].map((_, i) => sum(vs.map(a => a[i])))
}

function sum(v) {
  return v.reduce((a, c) => a + c, 0)
}

function mul(v, f) {
  return v.map(n => n * f)
}

function neg(v) {
  return mul(v, -1)
}

function dot(a, b) {
  return sum(a.map((_, i) => a[i] * b[i]))
}

function rot3(u, r) {
  const [x, y, z] = norm(u)
  const c = Math.cos(r)
  const s = Math.sin(r)
  const ci = 1 - c

  return [
    [x * x * ci + c, x * y * ci - z * s, x * z * ci + y * s],
    [x * y * ci + z * s, y * y * ci + c, y * z * ci - x * s],
    [x * z * ci - y * s, y * z * ci + x * s, z * z * ci + c]
  ]
}

function mdot(m, v) {
  return m.map(j => dot(j, v))
}

function mmul(m1, m2) {
  return m1.map((_, i) =>
    m2[0].map((_, k) =>
      dot(m1[i], m2.map(r => r[k]))))
}

function mix(materials, ratios = null) {
  ratios ||= materials.map(() => 1)

  const rs = sum(ratios)
  return materials[0].map((_, i) =>
    Math.sqrt(sum(materials.map((m, j) =>
      m[i] * m[i] * ratios[j] / rs))))
}

function mix2(a, b, r) {
  return mix([a, b], [r, 1 - r])
}

function clamp(v, l, h) {
  return Math.min(Math.max(v, l), h)
}

function fade(l, h, t) {
  return l + (h - l) * t
}
