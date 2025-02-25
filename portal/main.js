import { SdfSphere } from './shapes.js'
import { flat } from './materials.js'
import { cyan } from './colors.js'
import { Space } from './compositions.js'
import { Point, Transform } from './math.js'
import Camera from './camera.js'
import Canvas from './canvas.js'
import Controller from './controller.js'

const scene = new Space()
  .add(new SdfSphere()
    .painted(flat(cyan)))
// .add(new AnalyticalSphere(),
//   new Transform()
//     .move([1, 1, -6]))
// .add(new AnalyticalBox(),
//   new Transform()
//     .move([1, -1, -6]))
// .add(new SdfTorus(),
//   new Transform()
//     .move([-1, 1, -6]))
// .add(new SdfBox(),
//   new Transform()
//     .move([-1, -1, -6]))


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
