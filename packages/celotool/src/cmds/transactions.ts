import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/utils'
import { Argv } from 'yargs'

export const command = 'transactions <command>'

export const describe = 'commands for reading transaction data'

export type TransactionsArgv = CeloEnvArgv

export function builder(argv: Argv) {
  return addCeloEnvMiddleware(argv).commandDir('transactions', { extensions: ['ts'] })
}

export function handler() {
  // empty
}
