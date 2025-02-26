import { Point } from "./math.js"

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
      ['q', 'pan', () => this.state = 'pan'],
      ['w', 'rotate', () => this.state = 'rotate'],
      ['e', 'walk', () => this.state = 'walk'],
      ['r', 'tilt', () => this.state = 'tilt'],
      ['t', 'zoom/scale', () => this.state = 'zoom'],
      ['m', 'mode', () => {
        const modes = ['distance', 'normal', 'flat', 'shaded']
        this.camera.mode = modes[(modes.indexOf(this.camera.mode) + 1) % modes.length]
        console.log(this.camera.mode)
      }]
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

    this.perform(() => {
      if (this.state == 'pan') {
        this.camera.move(x / 100, -y / 100, 0)

      } else if (this.state == 'walk') {
        this.camera.move(0, 0, y / 100)
        this.camera.rotate(0, -x / 500, 0)

      } else if (this.state == 'rotate') {
        this.camera.rotate(-y / 500, -x / 500, 0)

      } else if (this.state == 'tilt') {
        this.camera.rotate(-y / 500, 0, -x / 500)

      } else if (this.state == 'zoom') {
        this.camera.zoom(-y / 500)
        this.camera.scale(1 - x / 500)
      }
    })
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
