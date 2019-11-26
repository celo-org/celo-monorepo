import { ContractKit } from '@celo/contractkit'
import {
  ProposalBuilder,
  ProposalTransactionJSON,
} from '@celo/contractkit/lib/governance/proposals'
import { readFileSync } from 'fs-extra'

export const buildProposalFromJsonFile = async (kit: ContractKit, jsonFile: string) => {
  const builder = new ProposalBuilder(kit)
  const jsonString = readFileSync(jsonFile).toString()
  const jsonTransactions: ProposalTransactionJSON[] = JSON.parse(jsonString)
  jsonTransactions.forEach((tx) => builder.addJsonTx(tx))
  return builder.build()
}
