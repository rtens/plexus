import test from 'ava'
import Parser from '../src/parser.js'

test('incomplete', t => {
  for (const s of ['', '[', '[foo', 'foo']) {
    should_parse(s, [undefined])(t)
  }
})

test('nothing', should_parse(
  '[]', [null]))

test('something', should_parse(
  '[foo]', [b('foo')]))

test('more tings', should_parse(
  '[foo][bar]', [b('foo'), b('bar')]))

test('list', should_parse(
  '[[foo][bar]]', [[b('foo'), b('bar')]]))

test('tree', should_parse(
  '[[[foo][bar]][baz]]', [[[b('foo'), b('bar')], b('baz')]]))

test('special', should_parse(
  '[\\n]', [b('\n')]))

test('escaped', should_parse(
  '[foo\\[bar\\]ba\\\\z]', [b('foo[bar]ba\\z')]
))

test.todo('malformed')

test.todo('fluff')

function b(string) {
  return Buffer.from(string, 'ascii')
}

function should_parse(string, parsed) {
  return t => {
    const parser = new Parser()
    parser.parse(string)
    t.like(parser.parsed, parsed)
  }
}
