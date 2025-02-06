export default class Parser {

  constructor() {
    this.parsed = []
    this.atom = ''
    this.stack = [this.parsed]
    this.state = 'out'
  }

  parse(string) {
    for (const c of string) {
      this['on_' + this.state](c)
    }
  }

  push(value) {
    this.stack[this.stack.length - 1]
      .push(value)
  }

  on_out(c) {
    if (c == '[') {
      this.state = 'list'

    } else if (c == ']') {
      this.push(this.stack.pop())
    }
  }

  on_list(c) {
    if (c == '[') {
      this.stack.push([])

    } else if (c == ']') {
      this.push(null)
      this.state = 'out'

    } else {
      this.state = 'atom'
      this.on_atom(c)
    }
  }

  on_atom(c) {
    if (c == ']') {
      this.push(Buffer.from(this.atom, 'ascii'))
      this.atom = ''
      this.state = 'out'

    } else if (c == '\\') {
      this.state = 'esc'

    } else {
      this.atom += c
    }
  }

  on_esc(c) {
    this.atom += eval(`'\\${c}'`)
    this.state = 'atom'
  }
}
