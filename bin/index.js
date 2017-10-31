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

const option = require(absolutePath)

if (option && Array.isArray(option.targets)) {
  start(option).then((server) => {
    console.log('Server is listening...\n')
    for (let target of option.targets) {
      const {host = 'localhost', port = 80, schema: _schema = 'http', ws} = target
      const schema = ws ? `${_schema}/ws` : _schema
      console.log(` - [${schema}] ${host}:${port}`)
    }
    console.log('\n------------------------------\n')
  })
} else {
  console.log('Options not found, exit...')
}

