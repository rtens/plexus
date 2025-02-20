export const flat = (r, g, b) => [r, g, b, 0, 0]

export const transp = (t, m) => p => (([r, g, b, _, s]) => [r, g, b, t, s])(m(p))

export const refl = (s, m) => p => (([r, g, b, t, _]) => [r, g, b, t, s])(m(p))

export const cyan = () => flat(0, 1, 1)

export const magenta = () => flat(1, 0, 1)

export const yellow = () => flat(1, 1, 0)

export const red = () => flat(1, 0, 0)

export const green = () => flat(0, 1, 0)

export const blue = () => flat(0, 0, 1)
