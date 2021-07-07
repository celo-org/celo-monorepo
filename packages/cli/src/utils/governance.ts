import { CeloTxPending } from '@celo/connect'
import { ContractKit } from '@celo/contractkit'

export async function checkProposal(
  proposal: Array<Pick<CeloTxPending, 'to' | 'input' | 'value'>>,
  kit: ContractKit
) {
  const governance = await kit.contracts.getGovernance()

  for (const tx of proposal) {
    console.log(tx)
    if (!tx.to) {
      continue
    }

    console.log(
      await kit.web3.eth.call({
        to: tx.to,
        from: governance.address,
        value: tx.value,
        data: tx.input,
      })
    )
  }
}
