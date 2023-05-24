import { defineConfig } from '@wagmi/cli'
import { react } from '@wagmi/cli/plugins'
import * as path from 'path'
import { ImplContracts } from './scripts/build'
import { readFileSync } from 'fs'

const BUILD_DIR = path.join(__dirname, 'build', 'contracts')
console.log(BUILD_DIR)

const contracts = []
for (const contractName of new Set(ImplContracts)) {
  try {
    const fileStr = readFileSync(path.join(BUILD_DIR, `${contractName}.json`))
    contracts.push({
      name: contractName,
      abi: JSON.parse(fileStr.toString()).abi,
    })
  } catch (e) {
    console.debug(`WARNING: ${contractName} artifact could not be fetched. Maybe it doesn't exist?`)
  }
}

export default defineConfig({
  out: path.join(BUILD_DIR, 'types', 'wagmi', 'index.ts'),
  contracts: contracts,
  plugins: [react()],
})
