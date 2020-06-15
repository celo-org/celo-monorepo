import { newKitFromWeb3 } from '@celo/contractkit'
import { ProposalBuilder } from '@celo/contractkit/lib/governance'
import { GovernanceWrapper, Proposal } from '@celo/contractkit/lib/wrappers/Governance'
import { NetworkConfig, testWithGanache, timeTravel } from '@celo/dev-utils/lib/ganache-test'
import { Address } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import Withdraw from './withdraw'

process.env.NO_SYNCCHECK = 'true'

const expConfig = NetworkConfig.governance

testWithGanache('governance:withdraw', (web3: Web3) => {
  const minDeposit = web3.utils.toWei(expConfig.minDeposit.toString(), 'ether')
  const kit = newKitFromWeb3(web3)

  let accounts: Address[] = []
  let governance: GovernanceWrapper

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    kit.defaultAccount = accounts[0]
    governance = await kit.contracts.getGovernance()
    let proposal: Proposal
    console.log((await governance.lastDequeue()).toNumber())
    proposal = await new ProposalBuilder(kit).build()
    await governance
      .propose(proposal, 'URL')
      .sendAndWaitForReceipt({ from: accounts[0], value: minDeposit })
    console.log(await governance.getProposalMetadata(1))
    await timeTravel(expConfig.dequeueFrequency + 1, web3)
    await governance.dequeueProposalsIfReady().sendAndWaitForReceipt()
  })

  test('can withdraw', async () => {
    console.log(await governance.getProposalMetadata(1))
    console.log(await governance.getProposalStage(1))
    const balanceBefore = await kit.web3.eth.getBalance(accounts[0])
    console.log(accounts[0], await governance.getRefundedDeposits(accounts[0]))
    console.log(await Withdraw.run(['--from', accounts[0]]))
    const balanceAfter = await kit.web3.eth.getBalance(accounts[0])
    const difference = new BigNumber(balanceAfter).minus(balanceBefore)
    expect(difference.toFixed()).toEqual(minDeposit)
  })
})
