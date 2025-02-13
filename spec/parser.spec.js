import test from 'ava'
import Parser from '../src/parser.js'
import Sig from '../src/sig.js'

test('incomplete', t => {
  for (const chunk of ['', '[', '[foo', 'foo']) {
    should_parse(chunk)(t)
  }
})

test('nothing', should_parse(
  '[][]', null, undefined))

test('string', should_parse(
  '[foo]', 'foo'))

test('multiple', should_parse(
  '[foo][bar]', 'foo', 'bar'))

test('list', should_parse(
  '[[foo][bar]]', ['foo', 'bar']))

test('tree', should_parse(
  '[[[foo][bar]][baz]]', [['foo', 'bar'], 'baz']))

test('special char', should_parse(
  '[\\n]', '\n'))

test('escaped', should_parse(
  '[foo\\[bar\\]ba\\\\z]', 'foo[bar]ba\\z'))

test('decimal', should_parse(
  '[#42]', 42))

test('zero', should_parse(
  '[#0]', 0))

test('ignore letters', should_parse(
  '[#4a2]', 42))

test('not decimal', should_parse(
  '[foo#42]', 'foo#42'))

test('hex', should_parse_sig(
  '[#xfaBExx42]', Sig.from('fabe42', 'hex')))

test('fluff', should_parse(
  'fluff[fluff[foo]fluff[bar]fluff]fluff', ['foo', 'bar']))

test('surprising end', should_parse(
  'foo]'))

function should_parse(string, ...parsed) {
  return should_parse_sig(string,
    ...parsed.map(p => Sig.from(p)))
}

function should_parse_sig(string, ...parsed) {
  return t => {
    const parser = new Parser()
    parser.parse(string)
    t.deepEqual(parser.parsed, parsed)
  }
}
