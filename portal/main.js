import { SdfSphere, SdfBox, SdfTorus, AnalyticalSphere, AnalyticalBox } from './shapes.js'
import { blue, cyan, magenta, red, yellow } from './colors.js'
import { Space } from './compositions.js'
import { Point, Transform } from './math.js'
import Camera from './camera.js'
import Canvas from './canvas.js'
import Controller from './controller.js'

const space = new Space()
  .add(new SdfSphere()
    .painted(cyan), new Transform()
      .moved(new Point(1, 1, 0)))
  .add(new SdfBox()
    .painted(blue), new Transform()
      .moved(new Point(2, 1, 0))
      .rotated(new Point(1, 1, 0), Math.PI / 4))
  .add(new SdfTorus()
    .painted(magenta), new Transform()
      .moved(new Point(-2, 1, 0))
      .rotated(new Point(1, 0, 0), 1))
  .add(new AnalyticalSphere()
    .painted(yellow), new Transform()
      .moved(new Point(-1, -1.5, 0)))
  .add(new AnalyticalBox()
    .painted(red), new Transform()
      .moved(new Point(2, -1.5, 0))
      .rotated(new Point(1, -1, 0), Math.PI / 4)
      .scaled(3 / 4))


const camera = new Camera(space)
camera.move(0, 0, 8)

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
