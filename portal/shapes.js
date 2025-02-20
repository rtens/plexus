import { len, add, neg } from './math.js'

const bound = (l, shape) => p => {
  const b = Math.max(...p.map(Math.abs))
  if (b > l + .1) return b - l
  return shape(p)
}

export const sphere = bound(1, p =>
  len(p) - 1)

export const box = b => bound(Math.max(...b), p => {
  const q = add(p.map(Math.abs), neg(b))
  return len(q.map(n => Math.max(n, 0))) + Math.min(Math.max(...q, 0), 0);
})

export const torus = ([tx, ty]) => bound(tx + ty, ([x, y, z]) => {
  const q = [len([x, z]) - tx, y]
  return len(q) - ty
})
