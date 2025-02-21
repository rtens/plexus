import { len, add, neg } from './math.js'

export const sphere = p => len(p) - 1

export const box = b => p => {
  const q = add(p.map(Math.abs), neg(b))
  return len(q.map(n => Math.max(n, 0))) + Math.min(Math.max(...q, 0), 0);
}

export const torus = ([tx, ty]) => ([x, y, z]) => {
  const q = [len([x, z]) - tx, y]
  return len(q) - ty
}
