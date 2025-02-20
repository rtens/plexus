export const norm = v => mul(v, 1 / len(v))

export const len = v => Math.sqrt(sum(v.map(n => n * n)))

export const add = (...vs) => vs[0].map((_, i) => sum(vs.map(a => a[i])))

export const sum = v => v.reduce((a, c) => a + c, 0)

export const mul = (v, f) => v.map(n => n * f)

export const neg = v => mul(v, -1)

export const dot = (a, b) => sum(a.map((_, i) => a[i] * b[i]))

export const mdot = (m, v) => m.map(j => dot(j, v))

export const clamp = (v, l, h) => Math.min(Math.max(v, l), h)

export const fade = (l, h, t) => l + (h - l) * t

export const mmul = (m1, m2) =>
  m1.map((_, i) =>
    m2[0].map((_, k) =>
      dot(m1[i], m2.map(r => r[k]))))

export const mix2 = (a, b, r) => mix([a, b], [r, 1 - r])

export const mix = (materials, ratios = null) => {
  ratios ||= materials.map(() => 1)
  return materials[0].map((_, i) =>
    Math.sqrt(sum(materials.map((m, j) =>
      m[i] * m[i] * ratios[j] / sum(ratios)))))
}

export const rot3 = (u, r) => {
  const [x, y, z] = norm(u)
  const c = Math.cos(r)
  const s = Math.sin(r)
  const ci = 1 - c

  return [
    [x * x * ci + c, x * y * ci - z * s, x * z * ci + y * s],
    [x * y * ci + z * s, y * y * ci + c, y * z * ci - x * s],
    [x * z * ci - y * s, y * z * ci + x * s, z * z * ci + c]
  ]
}
