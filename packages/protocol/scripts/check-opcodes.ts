import { exec, ExecException } from 'child_process'
import path from 'path'
import { CoreContracts } from './consts'

const UNSAFE_OPCODES = ['selfdestruct', 'delegatecall']

// ignore deprecated and known contracts
const IGNORE_CONTRACTS = ['ReleaseGold']
const CHECK_CONTRACTS = CoreContracts.filter((c) => !IGNORE_CONTRACTS.includes(c))

const handleGrepOutput = (err: ExecException, grepOutput: string, stderr: string) => {
  if (err || stderr) {
    throw new Error('grep failed')
  }

  const opcodeLines = grepOutput.toString().split('\n')

  let safe = true
  opcodeLines.forEach((line) => {
    const contractPath = line.split('.sol')[0]
    const contractMatch = contractPath.slice(contractPath.lastIndexOf('/') + 1)
    if (CHECK_CONTRACTS.includes(contractMatch)) {
      safe = false
      console.error(
        `Core contract ${contractMatch} should not include ${UNSAFE_OPCODES.join('+')} opcodes`
      )
    }
  })

  if (safe) {
    console.info(`Core contracts are safe against ${UNSAFE_OPCODES.join('+')} vulnerabilities`)
  } else {
    process.exit(1)
  }
}

const cmd = `egrep -r "(${UNSAFE_OPCODES.join('|')})\\(" ${path.join(__dirname, '../contracts')}`
exec(cmd, handleGrepOutput)
