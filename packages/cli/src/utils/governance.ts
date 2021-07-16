import { toTxResult } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'
import { ProposalTransaction } from '@celo/contractkit/src/wrappers/Governance'
import chalk from 'chalk'

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
    } catch (err) {
      console.log(chalk.red(`   ${chalk.bold('✘')}  Transaction ${i} failure: ${err.toString()}`))
      ok = false
    }
  }
  return ok
}
