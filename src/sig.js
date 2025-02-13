export default class Sig {

  static from(value, enc = 'ascii') {
    if (value instanceof Sig) {
      return value
    } else if (value instanceof Buffer) {
      return new One(value)
    } else if (value == null) {
      return none
    } else if (Array.isArray(value)) {
      if (!value.length) return none
      return new Many(value.map(v => Sig.from(v)))
    } else if (typeof value == 'object') {
      if (!Object.keys(value).length) return none
      return new Many(Object.entries(value)
        .reduce((acc, [k, v]) =>
          [...acc, Sig.from(k), Sig.from(v)],
          []))
    } else if (typeof value == 'number') {
      let hex = value.toString(16)
      if (hex.length % 2 == 1) hex = '0' + hex
      return new One(Buffer.from(hex, 'hex'))
    } else if (typeof value == 'string') {
      if (!value) return none
      return new One(Buffer.from(value, enc))
    }

    throw new Error('Unknown value: ' + value)
  }

  is(value) {
    return false
  }

  is_none() {
    return false
  }

  is_one() {
    return false
  }

  is_many() {
    return false
  }

  string() {
    return ''
  }

  number() {
    return 0
  }

  at(index) {
    return none
  }

  get(key) {
    return none
  }
}

class None extends Sig {

  is(value) {
    return Sig.from(value).is_none()
  }

  is_none() {
    return true
  }
}

const none = new None()

class One extends Sig {

  constructor(data) {
    super()
    this.data = data
  }

  is(value, enc = 'ascii') {
    if (value instanceof Sig) {
      return value instanceof One
        && this.string('hex') == value.string('hex')
    }

    return this.is(Sig.from(value, enc))
  }

  is_one() {
    return true
  }

  string(enc = 'ascii') {
    return this.data.toString(enc)
  }

  number() {
    if (!this.data.length) return 0
    return parseInt(this.data.toString('hex'), 16)
  }

  at(index) {
    if (index >= this.data.length) return none
    return new One(this.data.slice(index, index + 1))
  }
}

class Many extends Sig {

  constructor(sigs) {
    super()
    this.sigs = sigs
  }

  is(value) {
    if (value instanceof Sig) {
      return value instanceof Many
        && this.sigs.every((s, i) => s.is(value.at(i)))
    }

    return this.is(Sig.from(value))
  }

  is_none() {
    return !this.sigs.length
  }

  is_many() {
    return !this.is_none()
  }

  at(index) {
    return this.sigs[index] || none
  }

  get(key) {
    for (let i = 0; i < this.sigs.length; i += 2) {
      if (this.sigs[i].string() == key) {
        return this.sigs[i + 1] || none
      }
    }
    return none
  }
}
