import { len, add, mul, neg } from './math.js'

export default class Controller {

  constructor(camera, element) {
    this.camera = camera
    this.element = element

    this.state = 'rotate'
    this.step = .3
    this.turn = .05

    this.mouse = 'up'
    this.last = null

    this.draw_buttons()
    this.setup_listeners()
  }

  on_action() { }

  actions() {
    return [
      ['a', 'left', () => this.camera.move([-this.step, 0, 0])],
      ['d', 'right', () => this.camera.move([this.step, 0, 0])],
      ['w', 'up', () => this.camera.move([0, this.step, 0])],
      ['s', 'down', () => this.camera.move([0, -this.step, 0])],
      ['q', 'backward', () => this.camera.move([0, 0, this.step])],
      ['e', 'forward', () => this.camera.move([0, 0, -this.step])],
      ['j', 'turn left', () => this.camera.rotate([0, 1, 0], this.turn)],
      ['l', 'turn right', () => this.camera.rotate([0, 1, 0], -this.turn)],
      ['i', 'turn up', () => this.camera.rotate([1, 0, 0], this.turn)],
      ['k', 'turn down', () => this.camera.rotate([1, 0, 0], -this.turn)],
      ['u', 'turn counter', () => this.camera.rotate([0, 0, 1], this.turn)],
      ['o', 'turn clockwise', () => this.camera.rotate([0, 0, 1], -this.turn)],
      ['r', 'zoom in', () => this.camera.focal *= 1.1],
      ['f', 'zoom out', () => this.camera.focal /= 1.1],
      ['x', 'rotate', () => this.state = 'rotate'],
      ['c', 'pan', () => this.state = 'pan'],
      ['v', 'walk', () => this.state = 'walk'],
    ]
  }

  draw_buttons() {
    const buttons = document.getElementById('buttons')
    for (const [key, caption, action] of this.actions()) {
      const button = document.createElement('button')
      button.innerText = `${caption} (${key})`
      button.style.width = '15em'
      button.style.height = '5em'
      button.style.backgroundColor = '#111'
      button.style.border = '1px solid grey'
      button.style.color = 'grey'
      button.onclick = () => this.perform(action)
      buttons.appendChild(button)
    }
  }

  perform(action) {
    action()
    this.on_action()
  }

  clicked(c, p) {
    console.log('clicked', c, p)
  }

  dragged(a, b) {
    const [x, y] = add(b, neg(a))

    if (this.state == 'pan') {
      this.perform(() => this.camera.move(mul([x, -y, 0], 0.01)))

    } else if (this.state == 'walk') {
      this.perform(() => this.camera.move(mul([0, 0, y], 0.01)))
      const u = [0, x, 0]
      const r = -len(u) / 500
      if (!r) return
      this.perform(() => this.camera.rotate(u, r))

    } else {
      const u = [y, x, 0]
      const r = -len(u) / 500
      if (!r) return

      this.perform(() => this.camera.rotate(u, r))
    }
  }

  setup_listeners() {
    document.onkeydown = ({ key }) => {
      const action = this.actions().find(([k]) => k == key)
      if (action) this.perform(action[2])
    }

    const at = e => [e.clientX, e.clientY]

    this.element.onmousedown = e => {
      this.mouse = 'down'
      this.last = at(e)
    }

    this.element.onmouseup = e => {
      if (this.mouse == 'down') {
        const now = this.last
        // this.clicked(now, now.map(v => Math.floor(v / factor) - 1))
      }
      this.mouse = 'up'
    }

    this.element.onmousemove = e => {
      if (this.mouse == 'up') return
      this.mouse = 'drag'

      const now = at(e)
      this.dragged(this.last, now)
      this.last = now
    }

    const touch = handler => e => {
      e.preventDefault()
      handler(e.touches[0])
    }
    this.element.ontouchstart = touch(this.element.onmousedown)
    this.element.ontouchend = touch(this.element.onmouseup)
    this.element.ontouchmove = touch(this.element.onmousemove)
  }
}

