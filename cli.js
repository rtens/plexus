import readline from 'node:readline'
import Printer from './src/printer.js'
import Parser from './src/parser.js'
import Proc from './src/proc.js'
import Plex from './src/plex.js'
import Link from './src/link.js'
import Node from './src/node.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const commands = {
  '?': () => `Enter a Sig to send (e.g. [[to][you] [it][hello world]])
or enter / followed by a command name and its argument.

Available commands are:
  q                   - quit
  link [host [port]]  - link to a node`,

  q: () => process.exit(),

  link: (host = 'localhost', port = 4242) =>
    node.attach(new Link.Client(host, port))
}

console.log('Enter /? for help')

const parser = new Parser()
const printer = new Printer().pretty()

const plex = new Plex()
plex.add({
  bind: sig => console.log('\n<', printer.print(sig).split('\n').join('\n  '))
})
const emitter = plex.add(new Proc())

const node = new Node(plex)

while (true) {
  await new Promise(resolve =>
    rl.question('> ', input => {
      if (input.startsWith('/')) {
        execute_command(input.slice(1));
      } else {
        send_sig(input);
      }
      resolve()
    }))
}

function execute_command(input) {
  const args = input.split(' ');
  const command = commands[args.shift()]
  if (!command) {
    console.log('Unknown command')
  } else {
    command(...args)
  }
}

function send_sig(input) {
  parser.parse(input)
  while (parser.parsed.length) {
    emitter.emit(parser.parsed.shift())
  }
}
