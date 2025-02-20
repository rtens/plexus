import { add, mul, neg, rot3, mdot, mix2, clamp, fade } from './math.js'

export const $ = (i, ...p) => p.reduce((a, c) => c(a), i)

export const obj = (sdf, mat) => p => [sdf(p), mat(p)]

export const move = v => f => p => f(add(p, neg(v)))

export const rot = (u, r) => f => p => f(mdot(rot3(u, r), p))

export const scale = s => f => p => (([d, m]) => [d * s, m])(f(mul(p, 1 / s)))

export const round = r => f => p => (([d, m]) => [d - r, m])(f(p))

export const union = (...objs) => p =>
  objs.reduce((a, c) => !a || c(p)[0] < a[0] ? c(p) : a, null)

export const sunion = (k, o1, o2) => p => {
  const [d1, m1] = o1(p)
  const [d2, m2] = o2(p)
  const h = clamp(.5 + .5 * (d2 - d1) / k, 0, 1)
  return [
    fade(d2, d1, h) - k * h * (1 - h),
    mix2(m1, m2, h)
  ]
}
