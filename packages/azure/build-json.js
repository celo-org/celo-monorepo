#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const merge = require('deepmerge')
const mustache = require('mustache')

function load(acc, pathname) {
  const stat = fs.lstatSync(pathname)
  if (!stat.isDirectory()) {
    return acc.concat([fs.readFileSync(pathname).toString()])
  }
  fs.readdirSync(pathname).forEach((entry) => {
    acc = load(acc, path.join(pathname, entry))
  })
  return acc
}

function main() {
  const components = process.argv.slice(2)
  const contents = components.reduce(load, [])
  const variables = contents
    .map((string) => JSON.parse(string))
    .reduce((acc, val) => {
      return acc.concat(
        Object.entries(val.variables || {})
          .filter(([name, variable]) => typeof variable === 'string')
          .map(([name, variable]) => `'${name}=', variables('${name}'), ';'`)
      )
    }, [])
    .join(',')
  const parameters = contents
    .map((string) => JSON.parse(string))
    .reduce((acc, val) => {
      return acc.concat(
        Object.entries(val.parameters || {})
          .filter(([name, parameter]) => parameter.type === 'string' || parameter.type === 'int')
          .map(([name, parameter]) => `'${name}=', parameters('${name}'), ';'`)
      )
    }, [])
    .join(',')
  const proxyIps = [
    `'proxyInternalIpAddress='`,
    `reference(variables('proxyNetworkInterfaceName')).ipConfigurations[0].properties.privateIPAddress`,
    `';'`,
    `'proxyExternalIpAddress='`,
    `reference(variables('proxyPublicIpAddressName')).ipAddress`,
    `';'`,
  ].join(',')
  const validatorIps = [
    `'validatorInternalIpAddress='`,
    `reference(variables('validatorNetworkInterfaceName')).ipConfigurations[0].properties.privateIPAddress`,
    `';'`,
  ].join(',')
  const context = {
    attesterScript: fs.readFileSync('./build/attester-startup.sh').toString('base64'),
    proxyScript: fs.readFileSync('./build/proxy-startup.sh').toString('base64'),
    validatorScript: fs.readFileSync('./build/validator-startup.sh').toString('base64'),
    variables,
    parameters,
    proxyIps,
    validatorIps,
  }
  const objects = contents.map((content) => JSON.parse(mustache.render(content, context)))
  const armTemplate = merge.all(objects)
  process.stdout.write(JSON.stringify(armTemplate, null, 2))
}

main()
