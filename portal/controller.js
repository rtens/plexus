import { Point, Rotation, Translation } from "./math.js"

export default class Controller {

  constructor(camera, element) {
    this.camera = camera
    this.element = element

    this.state = 'rotate'

    this.mouse = 'up'
    this.last = null

    this.draw_buttons()
    this.setup_listeners()
  }

  render_with(render) {
    this.render = render
    render()
    return this
  }

  actions() {
    return [
      ['q', 'rotate', () => this.state = 'rotate'],
      ['w', 'walk', () => this.state = 'walk'],
      ['e', 'pan', () => this.state = 'pan'],
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
    this.render()
  }

  clicked(c, p) {
    console.log('clicked', c, p)
  }

  dragged(a, b) {
    const [x, y] = b.minus(a).values

    if (this.state == 'pan') {
      this.move(x, -y, 0)

    } else if (this.state == 'walk') {
      this.move(0, 0, y)
      this.rotate(0, x, 0)

    } else if (this.state == 'rotate') {
      this.rotate(y, x, 0)
    }
  }

  move(x, y, z) {
    this.perform(() =>
      this.camera.change(new Translation(new Point(x, y, z).times(0.01))))
  }

  rotate(x, y, z) {
    const u = new Point(x, y, z)
    const r = -u.length() / 500
    if (!r) return

    this.perform(() => this.camera.change(new Rotation(u, r)))
  }

  setup_listeners() {
    document.onkeydown = ({ key }) => {
      const action = this.actions().find(([k]) => k == key)
      if (action) this.perform(action[2])
    }

    const at = e => new Point(e.clientX, e.clientY)

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
