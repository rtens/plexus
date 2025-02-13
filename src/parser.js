import Sig from './sig.js'

export default class Parser {

  constructor() {
    this.parsed = []
    this.one = ''
    this.stack = [this.parsed]
    this.state = 'out'
  }

  parse(string_of_buffer) {
    for (const c of string_of_buffer) {
      this['on_' + this.state](c)
    }
    return this
  }

  push(value) {
    this.stack[this.stack.length - 1]
      .push(value)
  }

  on_out(c) {
    if (c == '[' || c == 17) {
      this.state = 'many'

    } else if (c == ']' || c == 19) {
      this.push(Sig.from(this.stack.pop()))

    }
  }

  on_many(c) {
    if (c == '[' || c == 17) {
      this.stack.push([])

    } else if (c == ']' || c == 19) {
      this.push(Sig.from(null))
      this.state = 'out'

    } else {
      this.state = 'one'
      this.on_one(c)
    }
  }

  on_one(c) {
    if (c == '[' || c == 17) {
      this.one = ''
      this.state == 'many'
      this.on_many(c)

    } else if (c == ']' || c == 19) {
      if (Array.isArray(this.one)) {
        this.push(Sig.from(Buffer.from(this.one)))
      } else {
        this.push(Sig.from(this.one))
      }
      this.one = ''
      this.state = 'out'

    } else if (c == '\\' || c == 18) {
      this.state = 'esc'

    } else if (!this.one && c == '#') {
      this.state = 'dec'

    } else if (typeof c == 'string') {
      this.one += c

    } else if (!this.one) {
      this.one = [c]
    } else {
      this.one.push(c)
    }
  }

  on_esc(c) {
    if (typeof c == 'string') {
      this.one += eval(`'\\${c}'`)
    } else if (!this.one) {
      this.one = [c]
    } else {
      this.one.push(c)
    }
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
