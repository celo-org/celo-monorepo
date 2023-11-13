import { defineConfig } from '@wagmi/cli'
import { readFileSync } from 'fs'
import * as path from 'path'
import { CoreContracts } from './scripts/build'

const BUILD_DIR = path.join(__dirname, 'build', 'abis/src')

const contracts: { name: string; abi: any }[] = []
for (const contractName of new Set(CoreContracts)) {
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

export default defineConfig(
  contracts.map(({ name, abi }) => ({
    out: path.join(BUILD_DIR, `${name}.ts`),
    contracts: [{ name, abi }],
    plugins: [],
  }))
)
