import { len, add, mul, neg, rot3, mdot, mmul } from './math.js'
import { sphere, box, torus } from './shapes.js'
import { cyan, magenta, yellow, refl } from './materials.js'
import { obj, union, move, rot, $ } from './construct.js'
import { Camera } from './render.js'

let scene = union(
  $(obj(box([.4, 1, .6]), refl(.2, magenta)),
    rot([1, 0, 0], -.6),
    move([-1.8, 0, -6])),
  $(obj(sphere, refl(.2, cyan)),
    move([0, .5, -7])),
  $(obj(torus([1.2, .3]), refl(.3, yellow)),
    rot([0, 0, 1], -1),
    move([1.5, -.5, -6])))

class Canvas {
  static state = 'up'
  static last = null

  constructor(factor = 1) {
    const element = document.getElementById("myCanvas")
    this.ctx = element.getContext("2d")

    this.size = [element.width, element.height]
    this.resolution = mul(this.size, 1 / factor)
    this.pixel = [factor, factor]

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
    const [pw, ph] = this.pixel
    const [r, g, b] = mul(color, 255).map(Math.round)

    this.ctx.fillStyle = `rgb(${r} ${g} ${b})`
    this.ctx.fillRect(x * pw, y * ph, pw, ph)
  }
}

let camera = new Camera(scene)

async function render(cam) {
  for (const prog of [20, 10, 5, 2, 1]) {
    const start = Date.now()
    await cam.render(new Canvas(prog))
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
  camera = new Camera(scene, cam.pos, cam.rot, cam.foc)
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
