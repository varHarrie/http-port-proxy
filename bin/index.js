#!/usr/bin/env node

const readline = require('readline')
const path = require('path')
const start = require('../dist').default

const relativePath = process.argv.slice(2)[0]

if (!relativePath) {
  console.log('Usage: http-port-proxy <option-path>')
  console.log('  Start a HTTP proxy server.')
  process.exit(0)
}

const absolutePath = path.join(process.cwd(), relativePath)

function question (words) {
  return new Promise((resolve) => {

    const interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })

    interface.question(words, (answer) => {
      interface.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

function run () {
  delete require.cache[absolutePath]
  const option = require(absolutePath)

  option && start(option)
    .then((server) => {
      console.log()

      return question([
        '================================',
        'Server is listening...',
        '',
        'R       - restart',
        'Any key - quit',
        '================================',
        ''
      ].join('\n'))
        .then((answer) => {
          server.close()
          if (answer === 'r') {
            return run()
          }
        })
    })
}

run()
