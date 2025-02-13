import test from 'ava'
import Printer from '../src/printer.js'
import Sig from '../src/sig.js'

test('null', should_print(
  null, '[]'))

test('empty string', should_print(
  '', '[]'))

test('string', should_print(
  'foo', '[foo]'))

test('zero', should_print(
  0, '[#0]'))

test('one', should_print(
  1, '[#1]'))

test('decimal', should_print(
  13, '[#13]'))

test('character', should_print(
  'a', '[#97]'))

test('hex', should_print_sig(
  Sig.from('8888888888', 'hex'), '[#x8888888888]'))

test('list', should_print(
  ['foo', ['bar']], '[[foo][[bar]]]'))

test('pretty', t => {
  const printed = new Printer().pretty()
    .print(Sig.from({
      foo: 'bar',
      bar: [42, 43, 44],
      one: { two: { tre: [['for']] } }
    }))

  t.is('\n' + printed, `
[ [foo]
  [bar]
  [bar]
  [ [#42] [#43] [#44]]
  [one]
  [ [two]
    [ [tre]
      [[[for]]]]]]`)
})

function should_print(input, expected) {
  return should_print_sig(Sig.from(input), expected)
}

function should_print_sig(sig, expected) {
  return t => {
    const printed = new Printer().print(sig)
    t.is(printed, expected)
  }
}

