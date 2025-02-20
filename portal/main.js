import { sphere, box, torus } from './shapes.js'
import { cyan, magenta, yellow, refl } from './materials.js'
import { obj, union, move, rot, $ } from './construct.js'
import Camera from './camera.js'
import Canvas from './canvas.js'
import Controller from './controller.js'

let scene = union(
  $(obj(box([.4, 1, .6]), refl(.2, magenta)),
    rot([1, 0, 0], -.6),
    move([-1.8, 0, -6])),
  $(obj(sphere, refl(.2, cyan)),
    move([0, .5, -7])),
  $(obj(torus([1.2, .3]), refl(.3, yellow)),
    rot([0, 0, 1], -1),
    move([1.5, -.5, -6])))

const element = document.getElementById("myCanvas")

const camera = new Camera(scene)

const controller = new Controller(camera, element)
controller.on_action = async () => {
  for (const size of [20, 10, 5, 2, 1]) {
    const start = Date.now()
    await camera.render(new Canvas(element, size), size < 20)
    console.log('rendered', size, (Date.now() - start) / 1000)
  }
}
controller.on_action()