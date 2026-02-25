import * as path from 'path'

const network = process.argv[2]
if (!network) {
  process.stderr.write('Usage: network-info.ts <network>\n')
  process.exit(1)
}

const configPath = path.resolve(__dirname, '../../truffle-config-parent.js')
const { networks, fornoUrls } = require(configPath)
const networkConfig = networks[network]
if (!networkConfig) {
  process.stderr.write(`No network config for '${network}'\n`)
  process.exit(1)
}

const rpcUrl = fornoUrls[network]
if (!rpcUrl) {
  process.stderr.write(`No forno URL for network '${network}'\n`)
  process.exit(1)
}

// Output all serializable metadata as JSON
const output: Record<string, unknown> = { rpcUrl }
for (const [key, value] of Object.entries(networkConfig as Record<string, unknown>)) {
  if (typeof value !== 'function') {
    output[key] = value
  }
}

process.stdout.write(JSON.stringify(output))
