#!/usr/bin/env node

const fs = require('fs')
const mustache = require('mustache')

function main() {
  const template = fs.readFileSync('./README.mustache').toString()
  const parameters = require('./components/main.json').parameters
  const view = {
    parameters: Object.entries(parameters).reduce((acc, [name, value]) => {
      if (value.defaultValue) {
        return acc
      }
      acc.push({
        name,
        type: value.type,
        defaultValue: value.defaultValue,
        description: value.metadata.description,
      })
      return acc
    }, []),
  }
  const docs = mustache.render(template, view)
  process.stdout.write(docs)
}

main()
