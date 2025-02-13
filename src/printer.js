export default class Printer {

  pretty() {
    return new PrettyPrinter()
  }

  print(sig) {
    if (sig.is_none()) {
      return '[]'

    } else if (sig.is_one()) {
      if (sig.data.length == 1) {
        return `[#${parseInt(sig.data.toString('hex'), 16)}]`

      } else if (Array.from(sig.data.values()).every(d => d >= 9 && d <= 13 || d >= 32 && d < 127)) {
        return `[${sig.string()
          .replaceAll('\n', '\\n')
          .replaceAll('\r', '\\r')}]`

      } else if (sig.data.length <= 4) {
        return `[#${parseInt(sig.data.toString('hex'), 16)}]`

      } else {
        return `[#x${sig.data.toString('hex')}]`
      }

    } else {
      return `[${sig.sigs.map(s => this.print(s)).join('')}]`
    }
  }
}

class PrettyPrinter extends Printer {

  print(sig, level = 0) {
    const indent = ' '.repeat(level)

    if (!sig.is_many()) {
      return indent + super.print(sig)

    } else if (sig.sigs.length == 1 || sig.sigs.length < 4 && sig.sigs.every(s => s.is_one())) {
      return indent + '[' + sig.sigs.map(s => this.print(s, level + 1)).map(s => s.trim()).join(' ') + ']'

    } else {
      return indent + '[ ' + sig.sigs.map(s => this.print(s, level + 2)).join('\n').trim() + ']'
    }
  }
}
