import Sig from './sig.js'

export default class Parser {

  constructor() {
    this.parsed = []
    this.one = ''
    this.stack = [this.parsed]
    this.state = 'out'
  }

  parse(string) {
    for (const c of string) {
      this['on_' + this.state](c)
    }
    return this
  }

  push(value) {
    this.stack[this.stack.length - 1]
      .push(value)
  }

  on_out(c) {
    if (c == '[') {
      this.state = 'many'

    } else if (c == ']') {
      if (this.stack.length == 1) return
      this.push(Sig.from(this.stack.pop()))

    }
  }

  on_many(c) {
    if (c == '[') {
      this.stack.push([])

    } else if (c == ']') {
      this.push(Sig.from(null))
      this.state = 'out'

    } else {
      this.state = 'one'
      this.on_one(c)
    }
  }

  on_one(c) {
    if (c == '[') {
      this.one = ''
      this.state == 'many'
      this.on_many(c)

    } else if (c == ']') {
      this.push(Sig.from(this.one))
      this.one = ''
      this.state = 'out'

    } else if (c == '\\') {
      this.state = 'esc'

    } else if (!this.one && c == '#') {
      this.state = 'dec'

    } else {
      this.one += c
    }
  }

  on_esc(c) {
    this.one += eval(`'\\${c}'`)
    this.state = 'one'
  }

  on_dec(c) {
    if (!this.one && c == 'x') {
      this.state = 'hex'

    } else if ('0123456789'.includes(c)) {
      this.one += c

    } else if (c == ']') {
      this.push(Sig.from(parseInt(this.one)))
      this.one = ''
      this.state = 'out'
    }
  }

  on_hex(c) {
    c = c.toLowerCase()

    if ('0123456789abcdef'.includes(c)) {
      this.one += c

    } else if (c == ']') {
      this.push(Sig.from(this.one, 'hex'))
      this.one = ''
      this.state = 'out'
    }
  }
}
