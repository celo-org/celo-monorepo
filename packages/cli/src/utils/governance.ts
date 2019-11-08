import { readFileSync } from 'fs-extra'

import { ContractKit } from '@celo/contractkit'
import {
  JSONTransaction,
  TransactionBuilder,
} from '@celo/contractkit/lib/wrappers/TransactionBuilder'

export const buildTransactionsFromJsonFile = (kit: ContractKit, jsonFile: string) => {
  const jsonString = readFileSync(jsonFile).toString()
  const jsonTransactions: JSONTransaction[] = JSON.parse(jsonString)
  return TransactionBuilder.fromCeloJsonTransactions(kit, jsonTransactions)
}
