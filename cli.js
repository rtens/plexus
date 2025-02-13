import readline from 'node:readline'
import Printer from './src/printer.js'
import Parser from './src/parser.js'
import Plex from './src/plex.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const commands = {
  '?': () => `Enter a Sig to send (e.g. [[to][you] [it][hello world]])
or enter / followed by a command name and its argument.

Available commands are:
  q                 - quit
  link host [port]  - link to a node`,
  
  q: () => process.exit()
}

console.log('Enter /? for help')

const parser = new Parser()
const printer = new Printer().pretty()

const plex = new Plex()
plex.add({
  bind: sig => console.log('<', printer.print(sig).split('\n').join('\n  '))
})

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
  const command = commands[args.shift()];
  if (!command) {
    console.log('Unknown command');
  } else {
    console.log(command(...args));
  }
}

function send_sig(input) {
  parser.parse(input + '\n');
  while (parser.parsed.length) {
    plex.bind(parser.parsed.shift());
  }
}
