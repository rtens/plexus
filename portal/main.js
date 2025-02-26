import { SdfSphere, SdfBox, SdfTorus } from './shapes.js'
import { Space } from './compositions.js'
import { Point, Transform } from './math.js'
import Camera from './camera.js'
import Canvas from './canvas.js'
import Controller from './controller.js'

const scene = new Space()
  .add(new SdfSphere(), new Transform()
    .moved(new Point(1, 0, -5)))
  .add(new SdfTorus(), new Transform()
    .moved(new Point(-2, 1, -5))
    .rotated(new Point(1, 0, 0), 1))
  .add(new SdfBox(), new Transform()
    .moved(new Point(2, 0, -5))
    .rotated(new Point(1, 1, 0), Math.PI / 4))


const camera = new Camera(scene)
camera.move(0, 0, 3)

const element = document.getElementById("myCanvas")
new Controller(camera, element)
  .render_with(async () => {
    // for (const size of [20]) {
    for (const size of [20, 10, 5, 2, 1]) {
      const start = Date.now()
      const canvas = new Canvas(element, size)
      const running = await camera.render(canvas, size < 20)
      if (!running) return
      console.log('rendered ', size, (Date.now() - start) / 1000)
    }
  })
