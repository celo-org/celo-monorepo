import { defineConfig } from '@wagmi/cli'
import { readFileSync } from 'fs'
import * as path from 'path'

import { ABIS_BUILD_DIR, PublishContracts } from './scripts/consts'

const contracts: { name: string; abi: any }[] = []
for (const contractName of new Set(PublishContracts)) {
  try {
    const fileStr = readFileSync(path.join(ABIS_BUILD_DIR, `${contractName}.json`))
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
    out: path.join(ABIS_BUILD_DIR, `${name}.ts`),
    contracts: [{ name, abi }],
    plugins: [],
  }))
)
