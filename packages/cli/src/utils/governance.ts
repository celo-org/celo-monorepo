import { toTxResult } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { ProposalTransaction } from '@celo/contractkit/src/wrappers/Governance'
import { ProposalBuilder, proposalToJSON, ProposalTransactionJSON } from '@celo/governance'
import chalk from 'chalk'
import { readJsonSync } from 'fs-extra'

export async function checkProposal(proposal: ProposalTransaction[], kit: ContractKit) {
  const governance = await kit.contracts.getGovernance()
  return tryProposal(proposal, kit, governance.address, true)
}

export async function executeProposal(
  proposal: ProposalTransaction[],
  kit: ContractKit,
  from: string
) {
  return tryProposal(proposal, kit, from, false)
}

async function tryProposal(
  proposal: ProposalTransaction[],
  kit: ContractKit,
  from: string,
  call: boolean
) {
  console.log('Simulating proposal execution')
  let ok = true
  for (const [i, tx] of proposal.entries()) {
    if (!tx.to) {
      continue
    }

    try {
      if (call) {
        await kit.web3.eth.call({
          to: tx.to,
          from,
          value: tx.value,
          data: tx.input,
        })
      } else {
        const txRes = toTxResult(
          kit.web3.eth.sendTransaction({ to: tx.to, from, value: tx.value, data: tx.input })
        )
        await txRes.waitReceipt()
      }
      console.log(chalk.green(`   ${chalk.bold('✔')}  Transaction ${i} success!`))
    } catch (err: any) {
      console.log(chalk.red(`   ${chalk.bold('✘')}  Transaction ${i} failure: ${err.toString()}`))
      ok = false
    }
  }
  return ok
}

export async function addExistingProposalIDToBuilder(
  kit: ContractKit,
  builder: ProposalBuilder,
  existingProposalID: string
) {
  const governance = await kit.contracts.getGovernance()
  const proposalRaw = await governance.getProposal(existingProposalID)
  return addProposalToBuilder(builder, await proposalToJSON(kit, proposalRaw))
}

export function addExistingProposalJSONFileToBuilder(
  builder: ProposalBuilder,
  existingProposalPath: string
) {
  return addProposalToBuilder(builder, readJsonSync(existingProposalPath))
}

async function addProposalToBuilder(
  builder: ProposalBuilder,
  existingProposal: ProposalTransactionJSON[]
) {
  // accounts for registry additions and caches in builder
  for (const tx of existingProposal) {
    await builder.fromJsonTx(tx)
  }

  console.info(
    `After executing provided proposal, account for registry remappings: ${JSON.stringify(
      builder.registryAdditions,
      null,
      2
    )}`
  )
}
