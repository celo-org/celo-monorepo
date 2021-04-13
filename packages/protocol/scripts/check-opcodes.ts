import { exec, ExecException } from 'child_process'
import path from 'path'

import { CoreContracts } from './build'

const ROOT_DIR = path.normalize(path.join(__dirname, '../'))

const UNSAFE_OPCODES = ['selfdestruct', 'delegatecall']
const IGNORE_CONTRACTS = ['ReleaseGold', 'TransferWhitelist']

const CHECK_CONTRACTS = CoreContracts.filter((c) => !IGNORE_CONTRACTS.includes(c))

const handleRgOutput = (err: ExecException, rgOutput: string, stderr: string) => {
  if (err || stderr) {
    throw new Error('ripgrep failed')
  }

  const opcodeLines = rgOutput.toString().split('\n')

  let safe = true
  opcodeLines.forEach((line) => {
    const contractPath = line.split('.sol')[0]
    const contractMatch = contractPath.slice(contractPath.lastIndexOf('/') + 1)
    if (CHECK_CONTRACTS.includes(contractMatch)) {
      safe = false
      console.error(`Core contract ${contractMatch} should not include ${UNSAFE_OPCODES} opcodes`)
    }
  })

  if (safe) {
    // tslint:disable:no-console
    console.log(`Core contracts are safe against ${UNSAFE_OPCODES} vulnerabilities`)
  } else {
    process.exit(1)
  }
}

exec(`rg --no-heading "${UNSAFE_OPCODES.join('|')}" ${ROOT_DIR}/contracts`, handleRgOutput)
