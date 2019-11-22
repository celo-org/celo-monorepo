import { ContractKit } from '@celo/contractkit'
import {
  ProposalBuilder,
  ProposalTransactionJSON,
} from '@celo/contractkit/lib/governance/proposals'
import { concurrentMap } from '@celo/utils/lib/async'
import { readFileSync } from 'fs-extra'

export const buildProposalFromJsonFile = async (kit: ContractKit, jsonFile: string) => {
  const builder = new ProposalBuilder(kit)
  const jsonString = readFileSync(jsonFile).toString()
  const jsonTransactions: ProposalTransactionJSON[] = JSON.parse(jsonString)
  await concurrentMap(5, jsonTransactions, builder.addJsonTx)
  return builder.proposal
}
