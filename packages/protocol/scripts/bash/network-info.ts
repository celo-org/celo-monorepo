import * as fs from 'fs'
import * as path from 'path'

const network = process.argv[2]
if (!network) {
  process.stderr.write('Usage: network-info.ts <network>\n')
  process.exit(1)
}

const configPath = path.resolve(__dirname, '../../truffle-config-parent.js')

// Extract fornoUrls via regex (not exported by the module)
const src = fs.readFileSync(configPath, 'utf8')
const match = src.match(/const fornoUrls\s*=\s*(\{[^}]+\})/s)
if (!match) {
  process.stderr.write('Could not find fornoUrls in truffle-config-parent.js\n')
  process.exit(1)
}
const fornoUrls: Record<string, string> = eval('(' + match[1] + ')')

// Load network config from the module export
const { networks } = require(configPath)
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
const output: Record<string, any> = { rpcUrl }
for (const [key, value] of Object.entries(networkConfig)) {
  if (typeof value !== 'function') {
    output[key] = value
  }
}

process.stdout.write(JSON.stringify(output))
